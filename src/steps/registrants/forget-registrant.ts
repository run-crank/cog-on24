import { BaseStep, Field, ExpectedRecord, StepInterface } from '../../core/base-step';
import { FieldDefinition, RunStepResponse, Step, StepDefinition, RecordDefinition } from '../../proto/cog_pb';

export class ForgetRegistrant extends BaseStep implements StepInterface {

  protected stepName: string = 'Forget an ON24 registrant';
  protected stepType: StepDefinition.Type = StepDefinition.Type.ACTION;
  protected stepExpression: string = 'forget that (?<email>.+) registered for ON24 event (?<eventId>\\d+)';
  protected stepHelp: string = 'This step attempts to "forget" (or delete) a registrant for the given event ID.';
  protected expectedFields: Field[] = [{
    field: 'email',
    type: FieldDefinition.Type.EMAIL,
    description: "Registrant's email address",
    help: 'This email address is used to identify the ON24 registrant who should be forgotten / deleted.',
  }, {
    field: 'eventId',
    type: FieldDefinition.Type.NUMERIC,
    description: 'Event ID',
    help: 'This ID is used to identify the ON24 event that this registrant should be removed from.',
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
      field: 'email',
      description: "Registrant's e-mail address",
      type: FieldDefinition.Type.EMAIL,
    }],
  }];

  async executeStep(step: Step): Promise<RunStepResponse> {
    let apiRes: any;
    const stepData: any = step.getData().toJavaScript();
    const eventId: number = stepData.eventId;
    const email: string = stepData.email;

    // Search ON24 for registrant.
    try {
      apiRes = await this.client.forgetEventRegistrantByEmail(eventId, email);
      const registrantRecord = this.keyValue('registrant', 'Created Registrant', {
        email,
        eventuserid: apiRes.deletedregistrants.eventuserids[0],
      });
      return this.pass('Successfully forgot registrant %s for event %d.', [email, eventId], [registrantRecord]);
    } catch (e) {
      return this.error('There was a problem forgetting the ON24 registrant: %s', [e.toString()]);
    }
  }

}

// Exports a duplicate of this class, aliased as "Step"
// See the constructor in src/core/cog.ts to understand why.
export { ForgetRegistrant as Step };
