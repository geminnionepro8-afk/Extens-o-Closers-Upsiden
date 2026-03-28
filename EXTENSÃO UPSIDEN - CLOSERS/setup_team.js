const { Client } = require('pg');
const connectionString = 'postgresql://postgres.imxwpacwtphekrbgwbph:C6J7ydUE2u8OILFi@aws-1-sa-east-1.pooler.supabase.com:6543/postgres';

async function runWithPg() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log('Connected to Postgres');

    const statements = [
      `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS admin_id UUID REFERENCES public.profiles(id);`,
      `CREATE TABLE IF NOT EXISTS public.team_invitations (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        code TEXT UNIQUE NOT NULL,
        admin_id UUID REFERENCES public.profiles(id) NOT NULL,
        role TEXT DEFAULT 'closer' CHECK (role IN ('admin', 'closer')),
        used_at TIMESTAMPTZ,
        used_by UUID,
        created_at TIMESTAMPTZ DEFAULT now()
      );`,
      `ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;`,
      `DROP POLICY IF EXISTS "invitations_select" ON public.team_invitations;`,
      `CREATE POLICY "invitations_select" ON public.team_invitations FOR SELECT USING (true);`,
      `DROP POLICY IF EXISTS "invitations_manage" ON public.team_invitations;`,
      `CREATE POLICY "invitations_manage" ON public.team_invitations FOR ALL USING (admin_id = auth.uid() OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');`,
      
      -- Modified handle_new_user trigger
      `CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS TRIGGER AS $$
      DECLARE
        invite_code TEXT;
        invite_row RECORD;
        final_nome TEXT;
        final_role TEXT;
        final_admin_id UUID;
      BEGIN
        invite_code := NEW.raw_user_meta_data->>'invitation_code';
        final_nome := COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1));
        
        final_role := 'closer';
        final_admin_id := NULL;

        IF invite_code IS NOT NULL THEN
          SELECT * INTO invite_row FROM public.team_invitations 
          WHERE code = invite_code AND used_at IS NULL;
          
          IF invite_row.id IS NOT NULL THEN
            UPDATE public.team_invitations 
            SET used_at = now(), used_by = NEW.id 
            WHERE id = invite_row.id;
            
            final_role := invite_row.role;
            final_admin_id := invite_row.admin_id;
          END IF;
        END IF;

        INSERT INTO public.profiles (id, email, nome, role, admin_id)
        VALUES (NEW.id, NEW.email, final_nome, final_role, final_admin_id)
        ON CONFLICT (id) DO UPDATE SET 
          nome = COALESCE(final_nome, public.profiles.nome),
          role = COALESCE(final_role, public.profiles.role),
          admin_id = COALESCE(final_admin_id, public.profiles.admin_id);
        
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;`
    ];

    for (const statement of statements) {
      try {
        await client.query(statement);
        console.log('Executed:', statement.substring(0, 50).replace(/\n/g, ' ') + '...');
      } catch (err) {
        console.error('Error in statement:', statement.substring(0, 50), '->', err.message);
      }
    }
  } catch (err) {
    console.error('Connection Error:', err.message);
  } finally {
    await client.end();
    console.log('Migration Complete');
  }
}

runWithPg();
