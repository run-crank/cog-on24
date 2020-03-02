/*tslint:disable:import-name*/

import * as grpc from 'grpc';
import On24 from 'node-on24';
import { Field } from '../core/base-step';
import { FieldDefinition } from '../proto/cog_pb';
import { RegistrantAwareMixin } from './mixins';

class ClientWrapper {

  public static expectedAuthFields: Field[] = [{
    field: 'clientId',
    type: FieldDefinition.Type.NUMERIC,
    description: 'Client ID',
    help: 'This is the numeric Client ID, found on your API Dashboard when creating the token.',
  }, {
    field: 'tokenKey',
    type: FieldDefinition.Type.STRING,
    description: 'Token Key',
    help: 'This alphanumeric string can be found on the API Dashboard.',
  }, {
    field: 'tokenSecret',
    type: FieldDefinition.Type.STRING,
    description: 'Token Secret',
    help: 'This alphanumeric string can be found on the API Dashboard.',
  }];

  /**
   * Private instance of the wrapped API client. You will almost certainly want
   * to swap this out for an API client specific to your Cog's needs.
   */
  public client: any;

  /**
   * Constructs an instance of the ClientWwrapper, authenticating the wrapped
   * client in the process.
   *
   * @param auth - An instance of GRPC Metadata for a given RunStep or RunSteps
   *   call. Will be populated with authentication metadata according to the
   *   expectedAuthFields array defined above.
   *
   * @param clientConstructor - An optional parameter Used only as a means to
   *   simplify automated testing. Should default to the class/constructor of
   *   the underlying/wrapped API client.
   */
  constructor (auth: grpc.Metadata, clientConstructor = On24) {
    // Authenticate the underlying client here.
    this.client = new clientConstructor({
      clientId: Number(auth.get('clientId')),
      tokenKey: auth.get('tokenKey').toString(),
      tokenSecret: auth.get('tokenSecret').toString(),
    });
  }

}

interface ClientWrapper extends RegistrantAwareMixin {}
applyMixins(ClientWrapper, [RegistrantAwareMixin]);

function applyMixins(derivedCtor: any, baseCtors: any[]) {
  baseCtors.forEach((baseCtor) => {
    Object.getOwnPropertyNames(baseCtor.prototype).forEach((name) => {
          // tslint:disable-next-line:max-line-length
      Object.defineProperty(derivedCtor.prototype, name, Object.getOwnPropertyDescriptor(baseCtor.prototype, name));
    });
  });
}

export { ClientWrapper as ClientWrapper };
