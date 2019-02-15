import * as request from 'request-promise';
import { ICredentialsInterface } from './interfaces/credentials.interface';
import * as Rx from 'rxjs';
import { of, throwError } from 'rxjs';
import { flatMap, retryWhen } from 'rxjs/operators';

export class AmoCrmApiClient {
  public requestPromise: any;

  constructor(private credentials: ICredentialsInterface) {
    this.requestPromise = request.defaults({
      baseUrl: `https://${this.credentials.subdomain}.amocrm.ru/`,
      jar: true,
      qs: {
        type: 'json',
      },
    });
  }

  public authenticate(): Promise<any> {
    return this.requestPromise.post({
      uri: '/private/api/auth.php',
      form: {
        USER_LOGIN: this.credentials.login,
        USER_HASH: this.credentials.hash,
      },
    });
  }

  public requestSafe(options): Promise<any> {
    return Rx.defer(() => this.requestPromise(options))
      .pipe(
        retryWhen(error =>
          error.pipe(
            flatMap((response, i) => {
              if (i >= 3) return throwError(response);
              if (response.statusCode === 401) return this.authenticate();
              return of(true);
            }),
          ),
        ),
      )
      .toPromise();
  }
}
