import { JsonProperty } from '../../main/decorators/JsonProperty';

type StringType = 'one' | 'other';

export class WithType {
    @JsonProperty()
    public dtype: StringType;
}
