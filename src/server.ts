import * as inversify from "inversify";
import * as restify from "restify";
import interfaces from "./interfaces";
import { TYPE, METADATA_KEY } from "./constants";

/**
 * Wrapper for the restify server.
 */
export class InversifyRestifyServer  {
    private kernel: inversify.interfaces.Kernel;
    private app: restify.Server = restify.createServer();
    private configFn: interfaces.ConfigFunction;

    /**
     * Wrapper for the restify server.
     *
     * @param kernel Kernel loaded with all controllers and their dependencies.
     */
    constructor(kernel: inversify.interfaces.Kernel) {
        this.kernel = kernel;
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

        let controllers: interfaces.Controller[] = this.kernel.getAll<interfaces.Controller>(TYPE.Controller);

        controllers.forEach((controller: interfaces.Controller) => {

            let controllerMetadata: interfaces.ControllerMetadata = Reflect.getOwnMetadata(
                METADATA_KEY.controller,
                controller.constructor
            );

            let methodMetadata: interfaces.ControllerMethodMetadata[] = Reflect.getOwnMetadata(
                METADATA_KEY.controllerMethod,
                controller.constructor
            );

            if (controllerMetadata && methodMetadata) {
                methodMetadata.forEach((metadata: interfaces.ControllerMethodMetadata) => {
                    let handler: restify.RequestHandler = this.handlerFactory(controllerMetadata.target.name, metadata.key);
                    let fullPath = metadata.path;
                    if (controllerMetadata.path !== "/") {
                        fullPath = controllerMetadata.path + metadata.path;
                    }
                    this.app[metadata.method](fullPath, [...controllerMetadata.middleware, ...metadata.middleware], handler);
                });
            }
        });
    }

    private handlerFactory(controllerName: any, key: string): restify.RequestHandler {
        return (req: restify.Request, res: restify.Response, next: restify.Next) => {
            let result: any = this.kernel.getNamed(TYPE.Controller, controllerName)[key](req, res, next);

            // try to resolve promise
            if (result && result instanceof Promise) {

                result.then((value: any) => {
                    if (value && !res.headersSent) {
                        res.send(value);
                    }
                })
                    .catch((error: any) => {
                        next(new Error(error));
                    });

            } else if (result && !res.headersSent) {
                res.send(result);
            }
        };
    }
}
