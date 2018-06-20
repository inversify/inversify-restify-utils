import * as inversify from "inversify";
import * as restify from "restify";
import { interfaces } from "./interfaces";
import { TYPE, METADATA_KEY } from "./constants";

/**
 * Wrapper for the restify server.
 */
export class InversifyRestifyServer {
    private container: inversify.interfaces.Container;
    private app: restify.Server;
    private configFn: interfaces.ConfigFunction;
    private defaultRoot: string | null = null;

    /**
     * Wrapper for the restify server.
     *
     * @param container Container loaded with all controllers and their dependencies.
     */
    constructor(container: inversify.interfaces.Container, opts?: (restify.ServerOptions & interfaces.ServerOptions)) {
        opts = {
            ignoreTrailingSlash : true,
            ...opts
        };

        this.container = container;
        this.app = restify.createServer(opts as restify.ServerOptions);
        if (
            opts &&
            opts.hasOwnProperty("defaultRoot") &&
            typeof (opts as interfaces.ServerOptions).defaultRoot === "string"
        ) {
            this.defaultRoot = (opts as interfaces.ServerOptions).defaultRoot as string;
        }
    }

    /**
     * Sets the configuration function to be applied to the application.
     * Note that the config function is not actually executed until a call to InversifyRestifyServer.build().
     *
     * This method is chainable.
     *
     * @param fn Function in which app-level middleware can be registered.
     */
    public setConfig(fn: interfaces.ConfigFunction): InversifyRestifyServer {
        this.configFn = fn;
        return this;
    }

    /**
     * Applies all routes and configuration to the server, returning the restify application.
     */
    public build(): restify.Server {
        // register server-level middleware before anything else
        if (this.configFn) {
            this.configFn.apply(undefined, [this.app]);
        }

        this.registerControllers();

        return this.app;
    }

    private registerControllers() {

        let controllers: interfaces.Controller[] = this.container.getAll<interfaces.Controller>(TYPE.Controller);

        controllers.forEach((controller: interfaces.Controller) => {

            let controllerMetadata: interfaces.ControllerMetadata = Reflect.getOwnMetadata(
                METADATA_KEY.controller,
                controller.constructor
            );

            if (this.defaultRoot !== null && typeof controllerMetadata.path === "string") {
                controllerMetadata.path = this.defaultRoot + controllerMetadata.path;
            } else if (this.defaultRoot !== null) {
                controllerMetadata.path = this.defaultRoot;
            }

            let methodMetadata: interfaces.ControllerMethodMetadata[] = Reflect.getOwnMetadata(
                METADATA_KEY.controllerMethod,
                controller.constructor
            );

            if (controllerMetadata && methodMetadata) {
                let controllerMiddleware = this.resolveMiddleware(...controllerMetadata.middleware);
                methodMetadata.forEach((metadata: interfaces.ControllerMethodMetadata) => {
                    let handler: restify.RequestHandler = this.handlerFactory(controllerMetadata.target.name, metadata.key);
                    let routeOptions: any = typeof metadata.options === "string" ? { path: metadata.options } : metadata.options;
                    let routeMiddleware = this.resolveMiddleware(...metadata.middleware);
                    if (typeof routeOptions.path === "string" && typeof controllerMetadata.path === "string"
                        && controllerMetadata.path !== "/") {
                        routeOptions.path = routeOptions.path === "/" ?
                            controllerMetadata.path : controllerMetadata.path + routeOptions.path;
                    } else if (routeOptions.path instanceof RegExp && controllerMetadata.path !== "/") {
                        routeOptions.path = new RegExp(controllerMetadata.path + routeOptions.path.source);
                    }
                    (this.app as any)[metadata.method](routeOptions, [...controllerMiddleware, ...routeMiddleware], handler);
                });
            }
        });
    }

    private resolveMiddleware(...middleware: interfaces.Middleware[]): restify.RequestHandler[] {
        return middleware.map(middlewareItem => {
            try {
                return this.container.get<restify.RequestHandler>(middlewareItem);
            } catch (_) {
                return middlewareItem as restify.RequestHandler;
            }
        });
    }

    private handlerFactory(controllerName: any, key: string): restify.RequestHandler {
        return (req: restify.Request, res: restify.Response, next: restify.Next) => {

            let result: any = (this.container.getNamed(TYPE.Controller, controllerName) as any)[key](req, res, next);

            // try to resolve promise
            if (result && result instanceof Promise) {

                result.then((value: any) => {
                    if (value && !res.headersSent) {
                        res.send(value);
                        next();
                    }
                })
                    .catch((error: any) => {
                        next(new Error(error));
                    });

            } else if (result && !res.headersSent) {
                res.send(result);
                next();
            }

        };
    }

}
