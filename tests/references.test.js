import assert from 'node:assert/strict';
import {validateReferences} from '../dist/references.js';
const a={type:'Model',slug:'coder',key:'models/coder',url:'https://knowledge.localllmfinder.com/models/coder/',entityIds:['model-11']};
assert.equal(validateReferences({version:1,articles:[a]}).get('Model:model-11').url,a.url);
assert.throws(()=>validateReferences({version:1,articles:[{...a,url:'javascript:alert(1)'}]}));
assert.throws(()=>validateReferences({version:1,articles:[a,a]}));
assert.equal(validateReferences({version:1,articles:[]}).size,0);
console.log('Reference URL validation, ID mapping and unavailable references passed.');
