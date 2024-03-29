import { ProtocolWithReturn } from "webext-bridge";

declare module "webext-bridge" {
  export interface ProtocolMap {
    hasSerenity: ProtocolWithReturn<boolean, boolean>;
  }
}
