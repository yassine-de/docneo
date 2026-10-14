import "server-only";

import { decryptTokenValue, encryptTokenValue } from "./crypto-core";

export const encryptToken = encryptTokenValue;
export const decryptToken = decryptTokenValue;
