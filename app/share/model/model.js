/**
 * This library is written to validate data from forms for my application
 */
function Model(opts) {
  var cl = this,
  service = {};
  for(var i in opts) {
    if(opts[i] && opts[i].type) {
      //String
      service[i] = {};
      if(opts[i].type === 'string') {
        this[i] = {data: opts[i].initial ? opts[i].initial : '',valid:true};
      } //Number
      else if(opts[i].type === 'number') {
        this[i] = {data:opts[i].initial ? opts[i].initial : 0,valid:true};
      } //Date
      else if(opts[i].type === 'date') {
        this[i] = {data:opts[i].initial ? opts[i].initial : new Date(),valid:true};
      }
    } else {
      this[i] = {data:'',valid: true};
    }
  }
  this.validate = function() {
    var valresult = true;
    for(var i in opts) {
      this[i].valid = true;
      if(opts[i].required || (this[i].data.length > 0)) {
        if(opts[i].eq && this[i].data !== this[opts[i].eq].data) {
          this[i].valid = false;
          this[i].cause = 'eq';
          this[i].msg = opts[i].err ? opts[i].err : 'This field must be equal to '+i;
        } else if(opts[i].type === 'string') {
          if(opts[i].regexp) {
            if(!opts[i].regexp.test(this[i].data)) {
              this[i].valid = false;
              this[i].cause = 'regexp';
              this[i].msg = opts[i].err ? opts[i].err : 'Regexp is not matching';
            }
          } else {
            if(opts[i].min) {
              if(this[i].data.length < opts[i].min) {
                this[i].valid = false;
                this[i].cause = 'short';
                this[i].msg = opts[i].err ? opts[i].err : 'too short. min - '+(opts[i].min-1);
              }
            }
            if(opts[i].max) {
              if(this[i].data.length > opts[i].max) {
                this[i].valid = false;
                this[i].cause = 'long';
                this[i].msg = opts[i].err ? opts[i].err : 'too long. max - '+(opts[i].max+1);
              }
            }
          }
        } //Number
        else if(opts[i].type === 'number') {
          if(opts[i].min) {
            if(this[i].data < opts[i].min) {
              this[i].valid = false;
              this[i].cause = 'short';
              this[i].msg = opts[i].err ? opts[i].err : 'Number must be greater than '+(opts[i].min-1);
            }
          }
          if(opts[i].max) {
            if(this[i].data > opts[i].max) {
              this[i].valid = false;
              this[i].cause = 'long';
              this[i].msg = opts[i].err ? opts[i].err : 'Number must be less than '+(opts[i].max+1);
            }
          }
        }
        valresult = valresult & this[i].valid;
      } else {
        this[i].valid = true;
      }
    }
    this.valid = valresult;
    return this.valid;
  };
  this.toJson = function(excludeFields) {
    var result = {};
    jQuery.each(opts, function(k,v){
      if(!excludeFields || excludeFields[k] == null) {
        result[k] = cl[k].data;
      }
    });
    return result;
  };
  this.clearData = function() {
    jQuery.each(opts, function(k,v){
      if(v.type === 'string')
        cl[k].data = '';
      else if(v.type === 'number')
        cl[k].data = 0;
    });
  };
  this.populate = function(genericObject) {
    for(var k in opts) {
      if(genericObject[k] && (typeof genericObject[k]).toLowerCase() === opts[k].type) {
        cl[k].data = genericObject[k];
      }
    }
  };
}

var ModelConfig = {
  email: function(req) {return {type: 'string', regexp: /.+@[a-z]+\.[a-z]+/, required: req, err: 'Пример: qwe@gmail.com'};},
  password: function(req) { return {type: 'string', min: 6, required: req, err: 'Минимум 6 символов'}; },
  password_retype: function(eq_field, req) { return {type: 'string', eq: eq_field, required: req, err: 'Пароли не совпадают'};},
  firstName: function(req) {return {type: 'string', min: 1, required: req, err: 'Обязательное'}; },
  lastName: function(req) {return {type: 'string', min: 1, required: req, err: 'Обязательное'}; },
  patron: function(req) {return {type: 'string', min: 1, required: req, err: 'Обязательное'}; },
  companyName: function(req) {return {type: 'string', min: 1, required: req, err: 'Обязательное'}; },
  description: function(req) {return {type: 'string', required: req, err: 'Обязательное'}; },
  phone: function(req) {return {type: 'string', regexp: /(\+7|7|8){0,1}[ -]?\d{3}[ -]?\d{3}[ -]?\d{2}[ -]?\d{2}/, required: req, err: 'Пример: 8 900 123 34 45'}; },
  website: function(req) {return {type: 'string', min:3, required: req}; }
};

var Models = {
  client: function(overrideOpts) {
    var result = {
      firstname: ModelConfig.firstName(true),
      lastname: ModelConfig.lastName(false),
      patron: ModelConfig.patron(false),
      phone: ModelConfig.phone(false),
      email: ModelConfig.email(false),
    };
    overrideLogic(result, overrideOpts);
    return result;
  }
};

function overrideLogic(src, opts) {
  for(var k in src) {
    if(opts[k] && typeof opts[k] === 'Object') {
      src[k] = opts[k];
    }
  }
}