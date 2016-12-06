import * as restify from "restify";

namespace interfaces {

    export interface ControllerMetadata {
        path: string;
        middleware: restify.RequestHandler[];
        target: any;
    }

    export type RouteOptions = string | { path: string } & Object;

    export interface ControllerMethodMetadata {
        options: RouteOptions;
        middleware: restify.RequestHandler[];
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

}

export { interfaces };
