import joi from 'joi';

const messageList = {
  VARIABLE_IS_INTEGER: '{{var}} must be an integer',
  VARIABLE_IS_REQUIRED: '{{var}} is required',
  VARIABLE_IS_LESS_THAN: '{{var}} must be at least {{var2}}',
  GREATER_THAN_ERROR: 'End time must be greater than or equal to start time',
  VARIABLE_MUST_BE_ARRAR: '{{var}} must be an array'
};

export const trimVideoSchema = joi.object({
  videoId: joi
    .number()
    .integer()
    .required()
    .messages({
      'number.base': messageList.VARIABLE_IS_INTEGER.replace(
        '{{var}}',
        'Video Id'
      ),
      'any.required': messageList.VARIABLE_IS_REQUIRED.replace(
        '{{var}}',
        'Video Id'
      )
    }),
  start: joi
    .number()
    .integer()
    .min(0)
    .required()
    .messages({
      'number.base': messageList.VARIABLE_IS_INTEGER.replace(
        '{{var}}',
        'Start time'
      ),
      'any.required': messageList.VARIABLE_IS_REQUIRED.replace(
        '{{var}}',
        'Start time'
      ),
      'number.min': messageList.VARIABLE_IS_LESS_THAN.replace(
        '{{var}}',
        'Start Time'
      ).replace('{{var2}}', '0 seconds')
    }),
  end: joi
    .number()
    .integer()
    .min(joi.ref('start'))
    .required()
    .messages({
      'number.base': messageList.VARIABLE_IS_INTEGER.replace(
        '{{var}}',
        'End time'
      ),
      'any.required': messageList.VARIABLE_IS_REQUIRED.replace(
        '{{var}}',
        'End time'
      ),
      'number.min': messageList.GREATER_THAN_ERROR
    })
});

export const mergeVideosSchema = joi.object({
  videoIds: joi
    .array()
    .items(joi.number().integer())
    .required()
    .messages({
      'array.base': messageList.VARIABLE_MUST_BE_ARRAR.replace(
        '{{var}}',
        'Video Ids'
      ),
      'any.required': messageList.VARIABLE_IS_REQUIRED.replace(
        '{{var}}',
        'Video Ids'
      )
    })
});

export const generateSharedLinkSchema = joi.object({
  videoId: joi
    .number()
    .integer()
    .required()
    .messages({
      'number.base': messageList.VARIABLE_IS_INTEGER.replace(
        '{{var}}',
        'Video ID'
      ),
      'any.required': messageList.VARIABLE_IS_REQUIRED.replace(
        '{{var}}',
        'Video ID'
      )
    }),
  expiresInHours: joi
    .number()
    .integer()
    .min(1)
    .required()
    .messages({
      'number.base': messageList.VARIABLE_IS_INTEGER.replace(
        '{{var}}',
        'Expiration time'
      ),
      'any.required': messageList.VARIABLE_IS_REQUIRED.replace(
        '{{var}}',
        'Expiration time'
      ),
      'number.min': 'Expiration time must be at least 1 hour'
    })
});

export const accessSharedLinkSchema = joi.object({
  linkId: joi
    .string()
    .guid()
    .required()
    .messages({
      'string.guid': 'Link ID must be a valid GUID',
      'any.required': messageList.VARIABLE_IS_REQUIRED.replace(
        '{{var}}',
        'Link ID'
      )
    })
});
