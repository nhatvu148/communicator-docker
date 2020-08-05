import * as path from 'path';
import * as url from 'url';
import * as os from 'os';
import * as express from 'express';

import {IPVersion} from "./SpawnerTypes";

/** Substitutes home-dir for '~/' */
export function expandHomeDir(dir: string): string {
    return dir.startsWith("~/") ? path.join(os.homedir(), dir.substring(1)) : dir;
}

/** Works like path.resolve(), but handles prefixed home-dir "~/" for 'dir' argument */
export function resolveDirs(root: string, dir: string): string {
    return path.resolve(root, expandHomeDir(dir));
}

/** Sends the given json data and response code for the given request. This will look for URL parameters to determine
 *  if the response should be sent as raw json or somehow prettied or transformed
 */
export function sendJsonResponse(req: express.Request, res: express.Response, code: number, json: any) {
    // Default is to send pretty-printed JSON data. Url param "raw=true" will send the tighter,
    // less human readable raw version
    const parsedUrl = url.parse(req.url, true);
    const rawParam = parsedUrl.query["raw"];
    const isRaw = rawParam && rawParam.toString().toLowerCase() === "true";
    if (isRaw) {
        res.status(200).json(json);
    } else {
        // Return a pretty printed JSON
        res.status(200).type('application/json').send(JSON.stringify(json, null, 2));
    }
}

/** Determines the localhost machine address given the IP-Version type. Note that we're *not*
 * using "localhost" as it's not guaranteed to be a valid hostname for a machine. 
 */
export function getLocalIpAddress(ipVersion: IPVersion): string {
    switch (ipVersion) {
        case IPVersion.ForceIPv4:
            return "127.0.0.1";
        case IPVersion.ForceIPv6Disabled:
            return "[::1]";
        case IPVersion.Auto:
        default:
            return "127.0.0.1";
    }
}

/** Get the appropriate websocket protocol string */
export function getWsProtocol(sslEnabled: boolean): string { return sslEnabled ? "wss" : "ws"; }

/** Get the appropriate http protocol string */
export function getHttpProtocol(sslEnabled: boolean): string { return sslEnabled ? "https" : "http"; }

/** Gets an appropriate hostname for local use. When using SSL, this may be the public hostname
 *  so that cert verification works as hoped.  */
export function getLocalHostname(sslEnabled: boolean, publicHostname: string, ipVersion: IPVersion): string {
    const hostname = sslEnabled ? publicHostname : getLocalIpAddress(ipVersion);
    return hostname;
}

/** Gets an appropriate hostname for public use. If none is specified, just uses local IP address */
export function getPublicHostname(publicHostname: string, ipVersion: IPVersion): string {
    const hostname = publicHostname ? publicHostname : getLocalIpAddress(ipVersion);
    return hostname;
}

/** Gets an associated reason string for a `ts3d_sc_server` exit code */
export function getTs3dScServerExitReason(exitCode: number): string { 
    switch (exitCode) {
        case 0: return "success";
        case 1: return "unexpected exit";
        case 2: return "invalid command line argument";
        case 3: return "internal error";
        case 4: return "failed to initialize the stream-cache";
        case 5: return "failed to initialize the curl library";
        case 6: return "invalid license";
        case 7: return "invalid license file";
        case 8: return "service-respawn failed";
        case 9: return "unable to get service-respawn exit-code";
    }
    return "unknown exit-code";
}
