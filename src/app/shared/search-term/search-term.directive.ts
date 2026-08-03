import { Directive } from '@angular/core';
import {
  NG_VALIDATORS,
  type AbstractControl,
  type ValidationErrors,
  type Validator,
} from '@angular/forms';
import { validateSearchTerm } from './search-term';

@Directive({
  selector: '[nvSearchTerm]',
  providers: [
    {
      provide: NG_VALIDATORS,
      useExisting: SearchTermValidator,
      multi: true,
    },
  ],
})
export class SearchTermValidator implements Validator {
  validate(control: AbstractControl): ValidationErrors | null {
    return validateSearchTerm(control.value as string | null);
  }
}
