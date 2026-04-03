---
trigger: always_on
---

Unlike the `local` and `sync` storage areas, the `managed` storage area requires its structure to be
declared as [JSON Schema](https://tools.ietf.org/html/draft-zyp-json-schema-03) and is strictly validated by Chrome. This schema must be stored in a
file indicated by the `"managed_schema"` property of the `"storage"` manifest key and declares the
enterprise policies supported by the extension.

Policies are analogous to options but are
[configured by a system administrator](https://www.chromium.org/administrators/)
for policy installed extensions, allowing the extension to be preconfigured for
all users of an organization. See [how Chrome handles policies](https://www.chromium.org/administrators/) for examples
from Chrome itself.

After declaring the policies they can be read from the [storage.managed](https://developer.chrome.com/docs/extensions/reference/storage#property-managed) API. It's up to the
extension to enforce the policies configured by the administrator.

## Sample manifest.json

The `storage.managed_schema` property indicates a file within the extension that contains the policy
schema.

    {
      "name": "My enterprise extension",
      "storage": {
        "managed_schema": "schema.json"
      },
      ...
    }

Chrome will then load these policies from the underlying operating system and from Google Apps for
signed-in users. The [`storage.onChanged`](https://developer.chrome.com/docs/extensions/reference/storage#event-onChanged) event is fired whenever a policy change is detected.
You can verify the policies that Chrome loaded at chrome://policy.

## Schema format

The JSON Schema format has some additional requirements from Chrome:

- The top-level schema must have type `object`.
- The top-level `object` can't have `additionalProperties`. The `properties` declared are the policies for this extension.
- Each schema must have either a `$ref` value or exactly one `type`.

If the schema is invalid then Chrome won't load the extension and will indicate the reason why the
schema wasn't validated. If a policy value does not conform to the schema then it won't be
published by the `storage.managed` API.

## Sample schema

    {
      "type": "object",

      // "properties" maps an optional key of this object to its schema. At the
      // top-level object, these keys are the policy names supported.
      "properties": {

        // The policy name "AutoSave" is mapped to its schema, which in this case
        // declares it as a simple boolean value.
        // "title" and "description" are optional and are used to show a
        // user-friendly name and documentation to the administrator.
        "AutoSave": {
          "title": "Automatically save changes.",
          "description": "If set to true then changes will be automatically saved.",
          "type": "boolean"
        },

        // Other simple types supported include "integer", "string" and "number".
        "PollRefreshRate": {
          "type": "integer"
        },

        "DefaultServiceUrl": {
          "type": "string"
        },

        // "array" is a list of items that conform to another schema, described
        // in "items". An example to this schema is [ "one", "two" ].
        "ServiceUrls": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },

        // A more complex example that describes a list of bookmarks. Each bookmark
        // has a "title", and can have a "url" or a list of "children" bookmarks.
        // The "id" attribute is used to name a schema, and other schemas can reuse
        // it using the "$ref" attribute.
        "Bookmarks": {
          "type": "array",
          "id": "ListOfBookmarks",
          "items": {
            "type": "object",
            "properties": {
              "title": { "type": "string" },
              "url": { "type": "string" },
              "children": { "$ref": "ListOfBookmarks" }
            }
          }
        },

        // An "object" can have known properties listed as "properties", and can
        // optionally have "additionalProperties" indicating a schema to apply to
        // keys that aren't found in "properties".
        // This example policy could map a URL to its settings. An example value:
        // {
        //   "youtube.com": {
        //     "blocklisted": true
        //   },
        //   "google.com": {
        //     "bypass_proxy": true
        //   }
        // }
        "SettingsForUrls": {
          "type": "object",
          "additionalProperties": {
            "type": "object",
            "properties": {
              "blocklisted": { "type": "boolean" },
              "bypass_proxy": { "type": "boolean" }
            }
          }
        }
      }
    }

# chrome.system.storage

<br />

<br />

## Description

Use the `chrome.system.storage` API to query storage device information and be notified when a removable storage device is attached and detached.

<br />

<br />

## Permissions

`system.storage`  

<br />

<br />

<br />

<br />

## Types

### EjectDeviceResultCode

#### Enum

"success"   
The ejection command is successful -- the application can prompt the user to remove the device.
"in_use"   
The device is in use by another application. The ejection did not succeed; the user should not remove the device until the other application is done with the device.
"no_such_device"   
There is no such device known.
"failure"   
The ejection command failed.

<br />

### StorageAvailableCapacityInfo

#### Properties

  - availableCapacity  
  number

  The available capacity of the storage device, in bytes.
  - id  
  string

A copied `id` of getAvailableCapacity function parameter `id`.  

### StorageUnitInfo

#### Properties

  - capacity  
  number

  The total amount of the storage space, in bytes.
  - id  
  string

  The transient ID that uniquely identifies the storage device. This ID will be persistent within the same run of a single application. It will not be a persistent identifier between different runs of an application, or between different applications.
  - name  
  string

  The name of the storage unit.
  - type  
  [StorageUnitType](https://developer.chrome.com/docs/extensions/reference/api/system/storage#type-StorageUnitType)

The media type of the storage unit.  

### StorageUnitType

#### Enum

"fixed"   
The storage has fixed media, e.g. hard disk or SSD.
"removable"   
The storage is removable, e.g. USB flash drive.
"unknown"   
The storage type is unknown.

<br />

## Methods

### ejectDevice()

```typescript
chrome.system.storage.ejectDevice(
  id: string,
): Promise<https://developer.chrome.com/docs/extensions/reference/api/system/storage#type-EjectDeviceResultCode>
```

Ejects a removable storage device.  

#### Parameters

  - id  
string  

#### Returns

  - Promise\<[EjectDeviceResultCode](https://developer.chrome.com/docs/extensions/reference/api/system/storage#type-EjectDeviceResultCode)\>  
Chrome 91+  

### getAvailableCapacity()

Dev channel

```typescript
chrome.system.storage.getAvailableCapacity(
  id: string,
): Promise<https://developer.chrome.com/docs/extensions/reference/api/system/storage#type-StorageAvailableCapacityInfo>
```

Get the available capacity of a specified `id` storage device. The `id` is the transient device ID from StorageUnitInfo.  

#### Parameters

  - id  
string  

#### Returns

- Promise\<[StorageAvailableCapacityInfo](https://developer.chrome.com/docs/extensions/reference/api/system/storage#type-StorageAvailableCapacityInfo)\>  

### getInfo()

```typescript
chrome.system.storage.getInfo(): Promise<https://developer.chrome.com/docs/extensions/reference/api/system/storage#type-StorageUnitInfo[]>
```

Get the storage information from the system. The argument passed to the callback is an array of StorageUnitInfo objects.  

#### Returns

  - Promise\<[StorageUnitInfo](https://developer.chrome.com/docs/extensions/reference/api/system/storage#type-StorageUnitInfo)\[\]\>  
  Chrome 91+

## Events

### onAttached

```typescript
chrome.system.storage.onAttached.addListener(
  callback: function,
)
```

Fired when a new removable storage is attached to the system.  

#### Parameters

  - callback  
  function


  The `callback` parameter looks like:  

  ```typescript
  (info: StorageUnitInfo) => void
  ```

  <br />

    - info  
[StorageUnitInfo](https://developer.chrome.com/docs/extensions/reference/api/system/storage#type-StorageUnitInfo)  

### onDetached

```typescript
chrome.system.storage.onDetached.addListener(
  callback: function,
)
```

Fired when a removable storage is detached from the system.  

#### Parameters

  - callback  
  function


  The `callback` parameter looks like:  

  ```typescript
  (id: string) => void
  ```

  <br />

    - id  
    string

<br />