import "sst/node/config";
declare module "sst/node/config" {
  export interface ConfigTypes {
    APP: string;
    STAGE: string;
  }
}

import "sst/node/auth";
declare module "sst/node/auth" {
  export interface AuthResources {
    "Auth": {
      publicKey: string;
    }
  }
}

