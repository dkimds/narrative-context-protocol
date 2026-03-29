const Ajv = require('ajv');
const fs = require('fs');
const path = require('path');

function validateFile(filePath) {
  try {
    // 스키마 로드
    const schemaPath = path.join(__dirname, '../schema/ncp-schema.json');
    const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));

    // 파일 로드
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    // Ajv 검증
    const ajv = new Ajv({ allErrors: true });
    const validate = ajv.compile(schema);
    const valid = validate(data);

    if (!valid) {
      return {
        valid: false,
        errors: validate.errors
      };
    }

    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      errors: [{ message: error.message }]
    };
  }
}

module.exports = { validateFile };
