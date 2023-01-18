import { Controller, Method } from "../src/decorators";
import { interfaces } from "../src/interfaces";

describe("Unit Test: Controller Decorators", () => {

    it("should add controller metadata to a class when decorated with @Controller", (done) => {
        let middleware = [function() { return; }, "foo", Symbol.for("bar")];
        let path = "foo";

        @Controller(path, ...middleware)
        class TestController {}

        let controllerMetadata: interfaces.ControllerMetadata = Reflect.getMetadata("_controller", TestController);

        expect(controllerMetadata.middleware).toEqual(middleware);
        expect(controllerMetadata.path).toEqual(path);
        expect(controllerMetadata.target).toEqual(TestController);
        done();
    });


    it("should add method metadata to a class when decorated with @Method", (done) => {
        let middleware = [function() { return; }, "bar", Symbol.for("baz")];
        let path = "foo";
        let method = "get";

        class TestController {
            @Method(method, path, ...middleware)
            public test() { return; }

            @Method("foo", "bar")
            public test2() { return; }

            @Method("bar", "foo")
            public test3() { return; }
        }

        let methodMetadata: interfaces.ControllerMethodMetadata[] = Reflect.getMetadata("_controller-method", TestController);

        expect(methodMetadata.length).toEqual(3);

        let metadata: interfaces.ControllerMethodMetadata = methodMetadata[0];

        expect(metadata.middleware).toEqual(middleware);
        expect(metadata.options).toEqual(path);
        expect(metadata.target.constructor).toEqual(TestController);
        expect(metadata.key).toEqual("test");
        expect(metadata.method).toEqual(method);
        done();
    });
});
