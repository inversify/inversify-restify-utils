import * as restify from "restify";
import { interfaces as inversifyInterfaces } from "inversify";

namespace interfaces {

    export type Middleware = (inversifyInterfaces.ServiceIdentifier<any> | restify.RequestHandler);
      
    export interface ControllerMetadata {
        path: string;
        middleware: Middleware[];
        target: any;
    }

    export type StrOrRegex = string | RegExp;
    export type RouteOptions = StrOrRegex | { path: StrOrRegex  } | { options: Object, path: StrOrRegex } & Object;

    export interface ControllerMethodMetadata {
        options: RouteOptions;
        middleware: Middleware[];
        target: any;
        method: string;
        key: string;
    }

    export interface Controller {}

    export interface HandlerDecorator {
        (target: any, key: string, value: any): void;
    }

    export interface ConfigFunction {
        (app: restify.Server): void;
    }

    export interface ServerOptions extends restify.ServerOptions {
      defaultRoot?: string;
    }
}

export { interfaces };
