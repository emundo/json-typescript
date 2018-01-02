import { Child } from './Child';
import { JsonProperty } from '../../main/decorators/JsonProperty';

export class Parent {

    @JsonProperty()
    public child: Child;

    constructor(data?: Parent) {

        if (!data) {
            return;
        }
    }
}
