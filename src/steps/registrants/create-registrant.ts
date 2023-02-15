import { BaseStep, Field, ExpectedRecord, StepInterface } from '../../core/base-step';
import { FieldDefinition, RunStepResponse, Step, StepDefinition, RecordDefinition, StepRecord } from '../../proto/cog_pb';

export class CreateRegistrant extends BaseStep implements StepInterface {

  protected stepName: string = 'Create an ON24 registrant';
  protected stepType: StepDefinition.Type = StepDefinition.Type.ACTION;
  protected actionList: string[] = ['create'];
  protected targetObject: string = 'Registrant';
  protected stepExpression: string = 'create an ON24 registrant for event (?<eventId>\\d+)';
  protected stepHelp: string = 'This step attempts to create a registrant for the given event ID.';
  protected expectedFields: Field[] = [{
    field: 'eventId',
    type: FieldDefinition.Type.NUMERIC,
    description: 'Event ID',
    help: 'This ID is used to identify the ON24 event. Event IDs can be found in your ON24 event dashboard.',
  }, {
    field: 'registrant',
    type: FieldDefinition.Type.MAP,
    description: 'A Map of registrant fields and their values.',
    help: 'All required fields for this event must be included, or else the step will result in an error.',
  }];
  protected expectedRecords: ExpectedRecord[] = [{
    id: 'registrant',
    type: RecordDefinition.Type.KEYVALUE,
    dynamicFields: true,
    fields: [{
      field: 'eventuserid',
      description: 'Event User ID',
      type: FieldDefinition.Type.NUMERIC,
    }, {
      field: 'createtimestamp',
      description: 'Registrant create date/time.',
      type: FieldDefinition.Type.DATETIME,
    }, {
      field: 'email',
      description: "Registrant's e-mail address",
      type: FieldDefinition.Type.EMAIL,
    }],
  }];

  async executeStep(step: Step): Promise<RunStepResponse> {
    const stepData: any = step.getData().toJavaScript();
    const eventId: number = stepData.eventId;
    const registrant: Record<string, any> = stepData.registrant;

    // Convert any true/false values (or strings) to expected 'Y' or 'N' values.
    this.convertBooleanToOn24YesNo(registrant);

    // Search ON24 for registrant.
    try {
      const apiRes = await this.client.createEventRegistrant(eventId, registrant);

      const registrantResponse = await this.client.getEventRegistrantByEmail(eventId, registrant.email);
      if (registrantResponse.registrants.length === 0) {
        // If no results were found, return an error.
        return this.error('No registrant found for event %d and email %s', [eventId, registrant.email]);
      }

      const createdRegistrant = registrantResponse.registrants[0];

      const records = this.createRecords(createdRegistrant, stepData['__stepOrder'], Object.keys(registrant));
      return this.pass('Successfully created registrant %s for event %d.', [apiRes.email, eventId], records);
    } catch (e) {
      console.log(e);
      return this.error('There was a problem creating the ON24 registrant: %s', [e.toString()]);
    }
  }

  public createRecords(registrant, stepOrder = 1, fields = []): StepRecord[] {
    const records = [];
    // Base Record
    records.push(this.keyValue('registrant', 'Registrant Record', registrant));

    // Passing Record
    const filteredData = {};
    if (registrant) {
      Object.keys(registrant).forEach((key) => {
        if (fields.includes(key)) {
          filteredData[key] = registrant[key];
        }
      });
    }
    records.push(this.keyValue('exposeOnPass:registrant', 'Created Record', filteredData));

    // Ordered Record
    records.push(this.keyValue(`registrant.${stepOrder}`, `Registrant Record from Step ${stepOrder}`, registrant));
    return records;
  }

}

// Exports a duplicate of this class, aliased as "Step"
// See the constructor in src/core/cog.ts to understand why.
export { CreateRegistrant as Step };
