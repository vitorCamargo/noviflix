import { Directive } from '@angular/core';
import {
  NG_VALIDATORS,
  type AbstractControl,
  type ValidationErrors,
  type Validator,
} from '@angular/forms';
import { validateSearchTerm } from './search-term';

/**
 * Attribute directive carrying the search rules, per the project spec's
 * requirement that the custom validation live in a directive.
 *
 * Registering through NG_VALIDATORS means Angular composes this with any other
 * validators on the control, and it works the same whether the control is
 * reactive or template-driven — the directive is found through the element's
 * injector either way, so nothing has to wire it up by hand.
 *
 * `useExisting` rather than `useClass`: the provider has to resolve to *this*
 * directive instance, not a second copy of it. With useClass the validator
 * Angular calls would be a different object from the one on the element, so any
 * state or inputs the directive gained later would be silently ignored.
 */
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
