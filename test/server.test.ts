// test libraries
import { expect } from "chai";
import * as sinon from "sinon";

// dependencies
import * as restify from "restify";
import { InversifyRestifyServer } from "../src/server";
import { Kernel, injectable } from "inversify";
import { TYPE } from "../src/constants";

describe("Unit Test: InversifyRestifyServer", () => {

    it("should call the configFn", (done) => {
        let middleware = function(req: restify.Request, res: restify.Response, next: restify.Next) { return; };
        let configFn = sinon.spy((app: restify.Server) => { app.use(middleware); });
        let errorConfigFn = sinon.spy((app: restify.Server) => { app.use(middleware); });
        let kernel = new Kernel();

        @injectable()
        class TestController {}

        kernel.bind(TYPE.Controller).to(TestController);
        let server = new InversifyRestifyServer(kernel);

        server.setConfig(configFn);

        expect(configFn.called).to.be.false;

        server.build();

        expect(configFn.calledOnce).to.be.true;
        done();
    });
});
