import React from 'react';
import FormInputValue, { VARIANTS as INPUT_VARIANTS } from '../components/FormInputValue';
import FormBooleanValue from '../components/FormBooleanValue';
import FormDatetimeValue from '../components/FormDatetimeValue';
import FormStaticValue from '../components/FormStaticValue';
import FormTextareaValue from '../components/FormTextareaValue';
import FormSelectValue, { VARIANTS as SELECT_VARIANTS } from '../components/FormSelectValue';

/**
 * List of XXXXX baseTypes
 * @type {object}
 */
const TYPES = {
  AUDIO: 'Audio',
  BOOLEAN: 'Boolean',
  CATEGORY: 'Category',
  DATE: 'Date',
  DATETIME: 'DateTime',
  IMAGE: 'Image',
  LONG_TEXT: 'Long Text',
  NUMBER: 'Number',
  SELECTION: 'Selection',
  SHORT_TEXT: 'Short Text',
  TIME: 'Time',
  VERSION: 'Version',
  VIDEO: 'Video',
};

/**
 * Mapping of XXXXX basetypes to our form components
 * @type {object}
 */
const COMPONENT_MAP = {
  [TYPES.BOOLEAN]: FormBooleanValue,
  [TYPES.DATE]: FormDatetimeValue,
  [TYPES.DATETIME]: FormDatetimeValue,
  [TYPES.LONG_TEXT]: FormTextareaValue,
  [TYPES.SELECTION]: FormSelectValue,
  [TYPES.SHORT_TEXT]: FormInputValue,
  [TYPES.TIME]: FormDatetimeValue,
};

/**
 * Translation map used by translateTemplateWithConfig
 */
const TRANSLATION_MAP = {
  /** 'Short Text' + 'Selection Options' */
  [`${TYPES.SHORT_TEXT}${SELECT_VARIANTS.Selection_Options}`]: [
    TYPES.SELECTION,
    null
  ],
  [TYPES.NUMBER]: [
    TYPES.SHORT_TEXT,
    INPUT_VARIANTS.Number
  ]
};

/**
 * Get the template and variant by splitting the `displayTemplate`.
 * eg: `Short Text - Max 5 lines` => ['Short Text', 'Max 5 lines']
 *
 * @param tpl
 */
const getTemplateVariant = (tpl) => tpl
  .split(/-|with/)
  .map(v => v.trim());

/**
 * Some XXXXX types make no sense. This method translates these into a usable set.
 * eg: 'Sort Text with Select Options' becomes [Select, Select Options]
 *
 * @param template
 * @param variant
 * @returns {*|[*,*]}
 */
const translateTemplateVariant = (template, variant = '') => {
  const mapString = `${template}${variant}`;
  return TRANSLATION_MAP[mapString] || [template, variant];
};

class FormValueFactory {
  /**
   * The factory build method
   * @param displayTemplate
   * @param config
   * @param value
   * @param extraProps
   * @returns {JSX}
   */
  static build(displayTemplate, config, value, extraProps = {}) {

    /**
     * Get the template & variant from the `displayTemplate` parameter
     */
    const [initialTemplate, initialVariant] = getTemplateVariant(displayTemplate);

    /**
     * Translate any odd template/variant combinations to something usefull
     */
    const [template, variant] = translateTemplateVariant(initialTemplate, initialVariant);

    /**
     * Grab our Component from the `COMPONENT_MAP`, fallback to `FormStaticValue` component
     * @type {object}
     */
    let FormValueComponent =
      COMPONENT_MAP[template] ||
      FormStaticValue;

    /**
     * Render our custom Component
     */
    return (
      <FormValueComponent
        config={config}
        variant={variant}
        value={value}
        {...extraProps} />
    );
  }
}

export { FormValueFactory, TYPES, COMPONENT_MAP, TRANSLATION_MAP };

export default FormValueFactory;
