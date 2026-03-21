/**
 * @file storage.service.js
 * @description Wrapper de Storage utilizando o Supabase SDK oficial.
 * @module Módulo 07: Serviços (Storage)
 * @author Pesquisador-Arquiteto SSOT
 * @date 21/03/2026
 */

class UpsidenStorage {
  static async upload(bucket, path, file, contentType) {
    const opts = { upsert: true };
    if (contentType) opts.contentType = contentType;
    const { data, error } = await supabaseClient.storage.from(bucket).upload(path, file, opts);
    if (error) throw error;
    return data;
  }
  
  static async download(bucket, path) {
    const { data, error } = await supabaseClient.storage.from(bucket).download(path);
    if (error) throw error;
    return data;
  }
  
  static async remove(bucket, paths) {
    const arr = Array.isArray(paths) ? paths : [paths];
    const { error } = await supabaseClient.storage.from(bucket).remove(arr);
    if (error) throw error;
    return true;
  }
  
  static signedUrl(bucket, path) {
    const { data } = supabaseClient.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }
}
