import { ListItem } from './support/ListItem';
import { SpecReporter } from 'jasmine-spec-reporter';
// Module
import { JsonTypescriptService } from './../main/service/JsonTypescriptService';
import { Logger } from './../main/log/Logger';

// Moment
import * as moment from 'moment';

// Setup...
const log = Logger.getInstance();
jasmine.getEnv().addReporter(new SpecReporter());
const jsog = new JsonTypescriptService();

describe('Serializing', () => {
    const foo: any = {};
    jsog.serialize(foo);
    it('should not modify the original obje', () => {
        expect(foo).toEqual({});
    });
});

describe('Deserializing object with two references to the same object', () => {
    const serialized: any = {
        inside1: {
            name: 'thing',
        },
        inside2: {
            name: 'thing',
        },
    };
    const deserialized: any = jsog.deserialize(serialized);

    it('should instantiate the inner object twice', () => {
        expect(deserialized.inside1).not.toBe(deserialized.inside2);
    });
    it('should deserialize the second object right', () => {
        expect(deserialized.inside1).toEqual({ name: 'thing' });
    });
});

describe('Serializing undefined', () => {
    it('should work', () => {
        expect(jsog.serialize(undefined) === undefined);
    });
    it('references should work', () => {
        const foo: any = {
            foo: undefined,
        };
        const serialized = jsog.serialize(foo);
        expect(serialized.foo).toBeUndefined();
    });
});

describe('Serializing arrays', () => {
    const foo: any = {
        bar: true,
    };
    const array: any = [foo, foo];
    const serialized: any = jsog.serialize(array);

    it('should work', () => {
        expect(serialized[0].bar).toBeTruthy();
        expect(serialized[1].bar).toBeTruthy();
    });
});

describe('Serializing objects with toJSON methods', () => {
    return it('should not change them', () => {
        const foo: any = {
            foo: moment(),
        };
        const serialized: any = jsog.serialize(foo);
        expect(serialized.foo === foo.foo);
    });
});

describe('Deserialize null values', () => {
    const serialized: any = {
        '@id': '1',
        // tslint:disable-next-line:no-null-keyword
        lorem: null,
    };
    const deserialized: any = jsog.deserialize(serialized);

    it('should work', () => {
        expect(deserialized.lorem).toBeNull();
    });
});
