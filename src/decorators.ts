import * as restify from "restify";
import interfaces from "./interfaces";
import { METADATA_KEY } from "./constants";

export function Controller(path: string, ...middleware: restify.RequestHandler[]) {
    return function (target: any) {
        let metadata: interfaces.ControllerMetadata = {path, middleware, target};
        Reflect.defineMetadata(METADATA_KEY.controller, metadata, target);
    };
}

export function Get   (path: string, ...middleware: restify.RequestHandler[]): interfaces.HandlerDecorator {
    return Method("get",    path, ...middleware);
}

export function Post  (path: string, ...middleware: restify.RequestHandler[]): interfaces.HandlerDecorator {
    return Method("post",   path, ...middleware);
}

export function Put   (path: string, ...middleware: restify.RequestHandler[]): interfaces.HandlerDecorator {
    return Method("put",    path, ...middleware);
}

export function Patch (path: string, ...middleware: restify.RequestHandler[]): interfaces.HandlerDecorator {
    return Method("patch",  path, ...middleware);
}

export function Head  (path: string, ...middleware: restify.RequestHandler[]): interfaces.HandlerDecorator {
    return Method("head",   path, ...middleware);
}

export function Delete(path: string, ...middleware: restify.RequestHandler[]): interfaces.HandlerDecorator {
    return Method("del", path, ...middleware);
}

export function Options(path: string, ...middleware: restify.RequestHandler[]): interfaces.HandlerDecorator {
    return Method("opts", path, ...middleware);
}

export function Method(method: string, path: string, ...middleware: restify.RequestHandler[]): interfaces.HandlerDecorator {
    return function (target: any, key: string, value: any) {
        let metadata: interfaces.ControllerMethodMetadata = {path, middleware, method, target, key};
        let metadataList: interfaces.ControllerMethodMetadata[] = [];

        if (!Reflect.hasOwnMetadata(METADATA_KEY.controllerMethod, target.constructor)) {
            Reflect.defineMetadata(METADATA_KEY.controllerMethod, metadataList, target.constructor);
        } else {
            metadataList = Reflect.getOwnMetadata(METADATA_KEY.controllerMethod, target.constructor);
        }

        metadataList.push(metadata);
    };
}
