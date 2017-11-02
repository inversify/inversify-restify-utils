import { interfaces } from "./interfaces";
import { METADATA_KEY } from "./constants";

export function Controller(path: string, ...middleware: interfaces.Middleware[]) {
    return function (target: any) {
        let metadata: interfaces.ControllerMetadata = {path, middleware, target};
        Reflect.defineMetadata(METADATA_KEY.controller, metadata, target);
    };
}

export function Get(options: interfaces.RouteOptions, ...middleware: interfaces.Middleware[]): interfaces.HandlerDecorator {
    return Method("get", options, ...middleware);
}

export function Post(options: interfaces.RouteOptions, ...middleware: interfaces.Middleware[]): interfaces.HandlerDecorator {
    return Method("post", options, ...middleware);
}

export function Put(options: interfaces.RouteOptions, ...middleware: interfaces.Middleware[]): interfaces.HandlerDecorator {
    return Method("put", options, ...middleware);
}

export function Patch(options: interfaces.RouteOptions, ...middleware: interfaces.Middleware[]): interfaces.HandlerDecorator {
    return Method("patch", options, ...middleware);
}

export function Head(options: interfaces.RouteOptions, ...middleware: interfaces.Middleware[]): interfaces.HandlerDecorator {
    return Method("head", options, ...middleware);
}

export function Delete(options: interfaces.RouteOptions, ...middleware: interfaces.Middleware[]): interfaces.HandlerDecorator {
    return Method("del", options, ...middleware);
}

export function Options(options: interfaces.RouteOptions, ...middleware: interfaces.Middleware[]): interfaces.HandlerDecorator {
    return Method("opts", options, ...middleware);
}

export function Method(
    method: string,
    options: interfaces.RouteOptions,
    ...middleware: interfaces.Middleware[]
): interfaces.HandlerDecorator {
    return function (target: any, key: string) {
        let metadata: interfaces.ControllerMethodMetadata = {options, middleware, method, target, key};
        let metadataList: interfaces.ControllerMethodMetadata[] = [];

        if (!Reflect.hasOwnMetadata(METADATA_KEY.controllerMethod, target.constructor)) {
            Reflect.defineMetadata(METADATA_KEY.controllerMethod, metadataList, target.constructor);
        } else {
            metadataList = Reflect.getOwnMetadata(METADATA_KEY.controllerMethod, target.constructor);
        }

        metadataList.push(metadata);
    };
}
