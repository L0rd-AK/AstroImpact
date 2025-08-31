const Joi = require('joi');

// Validation schemas
const schemas = {
  register: Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    profile: Joi.object({
      firstName: Joi.string().max(50),
      lastName: Joi.string().max(50),
      country: Joi.string().max(100),
      city: Joi.string().max(100)
    }).optional()
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  simulation: Joi.object({
    asteroid: Joi.string().hex().length(24).required(),
    impactLocation: Joi.object({
      latitude: Joi.number().min(-90).max(90).required(),
      longitude: Joi.number().min(-180).max(180).required(),
      address: Joi.string().max(200),
      country: Joi.string().max(100),
      city: Joi.string().max(100)
    }).required(),
    impactAngle: Joi.number().min(0).max(90).default(45),
    mitigationStrategy: Joi.object({
      method: Joi.string().valid(
        'kinetic_impactor',
        'nuclear_device',
        'gravity_tractor',
        'solar_sail',
        'mass_driver',
        'ion_beam',
        'evacuation_only',
        'none'
      ).default('none'),
      description: Joi.string().max(1000),
      estimatedCost: Joi.number().min(0),
      successProbability: Joi.number().min(0).max(100),
      timeRequired: Joi.number().min(0)
    }).optional(),
    isPublic: Joi.boolean().default(true)
  }),

  vote: Joi.object({
    vote: Joi.string().valid('like', 'dislike').required()
  }),

  comment: Joi.object({
    text: Joi.string().min(1).max(500).required()
  })
};

// Validation middleware factory
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      const errorDetails = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      return res.status(400).json({
        error: 'Validation error',
        details: errorDetails
      });
    }
    
    req.validatedData = value;
    next();
  };
};

module.exports = {
  validate,
  schemas
};
