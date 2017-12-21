// Support
import 'reflect-metadata';
import { Class } from '../support/Class';
import { Map } from '../support/Map';

// Model
import { JsonObject } from '../model/JsonObject';

// Logger
import { Logger } from '../log/Logger';

/**
 * JavaScript Object Graph Service.
 *
 * Instances of this class can be used to serialize and deserialize Objects
 * Graphs to and from Json.
 */
export class JsonTypescriptService {

    // ------------------------------------------------------------------------
    // Private fields
    // ------------------------------------------------------------------------
    private log = Logger.getInstance();

    // ------------------------------------------------------------------------
    // Public fields
    // ------------------------------------------------------------------------

    /**
     * Flag to enable debug output.
     */
    public set debugEnabled(debugEnabled: boolean) {
        this.log.debugEnabled = debugEnabled;
    }
    public get debugEnabled(): boolean {
        return this.log.debugEnabled;
    }

    /**
     * Test if object has a custom Jsonification function.
     *
     * @param object to test.
     */
    private hasCustomJsonificaiton(object: any): boolean {
        return typeof object.toJSON === 'function';
    }

    /**
     * Test if the object is an Array.
     *
     * @param object to test.
     */
    private isArray(object: any): boolean {
        return Object.prototype.toString.call(object) === '[object Array]';
    }

    /**
     * Removes all elements from an Array.
     *
     * @param array to clear
     */
    private clearArray(array: any[]): void {
        array.length = 0;
    }

    /**
     * Get the defined Class of an object.
     *
     * The Property needs to be annotated.
     *
     * @param target Object to find Class of propertyKey for.
     * @param propertyKey Property name to find Class for.
     */
    private getClass(target: object, propertyKey: string): Class<any> {
        return Reflect.getMetadata('design:type', target, propertyKey);
    }

    /**
     * Serialize an Object to a JavaScript Object Graph.
     *
     * If an Object in the Graph has a custom toJSON function this is used for serialization.
     *
     * @param object to serialize.
     */
    public serialize<T>(object: T): T {
        this.log.debug('serialize:');
        this.log.debug(object);

        /**
         * Recursive Serialization function.
         *
         * @param original Any object.
         */
        const serializeRecursive = (original: any): any => {

            /**
             * Serialize an Object.
             *
             * @param original An Object to Serialize.
             */
            const serializeObject = (original: T): JsonObject => {
                return original;
            };

            /**
             * Serialize every element of an array.
             *
             * @param array to serialize
             */
            const serializeArray = (array: T[]): JsonObject[] => {
                const allEncoded: JsonObject[] = [];
                for (const entry of array) {
                    allEncoded.push(serializeRecursive(entry));
                }
                return allEncoded;
            };

            if (!original) {
                return original;
            } else if (this.hasCustomJsonificaiton(original)) {
                return original;
            } else if (this.isArray(original)) {
                return serializeArray(original);
            } else if (typeof original === 'object') {
                return serializeObject(original);
            } else {
                return original;
            }
        };

        // Call recursive serialization.
        return serializeRecursive(object);
    }

    /**
     * Deserialize an JavaScript Object Graph Array.
     *
     * @param jsogObject Array of JsogObjects.
     * @param clazz Class to instantiant the array entries with.
     */
    public deserializeArray<T extends object>(jsogObject: T[], clazz?: Class<T>): T[] {
        return <T[]>this.deserialize(jsogObject, clazz);
    }

    /**
     * Deserialize an JavaScript Object Graph.
     *
     * @param jsogObject JavaScript Object Graph root.
     * @param clazz Class to intantiate the root with.
     */
    public deserializeObject<T extends object>(jsogObject: T, clazz?: Class<T>): T {
        return <T>this.deserialize(jsogObject, clazz);
    }

    public deserialize<T extends object>(jsogObject: T | T[], classObject?: Class<T>): T | T[] {
        this.log.debug('deserialize:');
        this.log.debug(jsogObject);
        this.log.debug('as class:');
        this.log.debug(classObject);

        // Map of found objects by identifier.
        const found: Map<object> = {};

        const deserializeRecursive = <T extends any>(jsogObject: T | T[],
            classObject?: Class<T>): T | T[] => {
            this.log.debug('deserializeRecursive:');
            this.log.debug(jsogObject);
            this.log.debug('as class:');
            this.log.debug(classObject);

            const deserializeObject = <T extends object>(jsogObject: JsonObject, classObject?: Class<T>): T => {
                this.log.debug('deserializeObject:');
                this.log.debug(jsogObject);
                this.log.debug('as class:');
                this.log.debug(classObject);

                let result: any;
                if (classObject) {
                    result = new classObject();
                } else {
                    result = {};
                }

                for (const key of Object.keys(jsogObject)) {
                    if (Reflect.hasMetadata('JsonProperty', result, key)) {
                        let clazz = Reflect.getMetadata('JsonProperty', result, key);
                        if (!clazz) {
                            clazz = this.getClass(result, key);
                        }
                        result[key] = deserializeRecursive(jsogObject[key], clazz);
                    } else {
                        result[key] = deserializeRecursive(jsogObject[key]);
                    }

                }

                return result;
            };

            const deserializeArray = <T extends object>(jsogObject: JsonObject[], classObject?: Class<T>): T[] => {
                const result: T[] = [];
                for (const value of jsogObject) {
                    // We now this cast is true.
                    result.push(<T>deserializeRecursive(value, classObject));
                }
                return result;
            };

            // Skip deserialization of null.
            if (jsogObject === null) {
                return null;
            }
            // Deserialize Arrays.
            if (this.isArray(jsogObject)) {
                // We know this cast ist ture.
                jsogObject = <T[]>jsogObject;
                return deserializeArray(jsogObject, classObject);
            }
            // Deserialize Objets
            if (typeof jsogObject === 'object') {
                // We know this cast ist ture.
                jsogObject = <T>jsogObject;
                return deserializeObject(jsogObject, classObject);
            }

            return jsogObject;
        };

        return deserializeRecursive(jsogObject, classObject);
    }
}
