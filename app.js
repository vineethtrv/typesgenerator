const RESULT_EL = document.getElementById('type-result');
const INPUT_EL = document.getElementById('type-input');
const NAME_EL = document.getElementById('root-name');
const BTN_COPY = document.getElementById('btn-copy');

let output;
let name = 'Root'
let result = {};
const toCamelCase =  (str) =>{
    str = str
        .replace(/\s(.)/g, function ($1) { return $1.toUpperCase(); })
        .replace(/\s/g, '')
        .replace(/^(.)/, function ($1) { return $1.toLowerCase(); })
        .replace(/[^a-zA-Z0-9]+(.)/g, (m, chr) => chr.toUpperCase());
   return  str.charAt(0).toUpperCase() + str.slice(1);
}
const isValidJSONString  =  (str) => {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

const getTypes = (arrayType, item) => {
  return  arrayType.includes(item) ? '' : arrayType.length ? ' | ' + item : item;
}


const EDITOR = CodeMirror.fromTextArea(INPUT_EL, {
    tabSize: 2,
    lineNumbers: true,
    mode: "application/json",
    theme: 'material-palenight',
    gutters: ["CodeMirror-lint-markers"],
    lint: true
});

const RESULT = CodeMirror(RESULT_EL, {
    lineNumbers: true,
    tabSize: 2,
    mode: 'javascript',
    theme: 'material-palenight',
    readOnly: 'nocursor'
});

const isJSON = (item)=>{
    return typeof item === 'object' && !Array.isArray(item) && item;
}

// Editor update
EDITOR.on('change', (editor) => {
    updateInterFace()
});


// Name Update 
NAME_EL.addEventListener('input', (event) => {
    updateInterFace();
})

// Copy 
BTN_COPY.addEventListener('click', (event) => {
    navigator.clipboard.writeText(RESULT.doc.getValue()).then(function () {
        console.log('Async: Copying to clipboard was successful!');
        document.querySelector('.toaster').classList.toggle('show');

        setInterval(() => {
            document.querySelector('.toaster').classList.remove('show');
        }, 600)
    }, function (err) {
        console.error('Async: Could not copy text: ', err);
    });

})

const updateInterFace = ()=> {
    if (isValidJSONString(EDITOR.doc.getValue())) {
        let object = JSON.parse(EDITOR.doc.getValue());
        let name = NAME_EL.value.trim() ? NAME_EL.value : 'Root Object';
        result = {};
        let flattenObject = flatten(name, object);
        RESULT.getDoc().setValue(flattenObject);
    }
}




const flatten = (name, object)=> {
    name = toCamelCase(name); // Make name camel case

    // If object is an array
    if (Array.isArray(object)) {
        let output = '';
        let arrayType = '';

        object.forEach(objArrayItem => {
            if (typeof objArrayItem === 'object' && objArrayItem !== null) {
                output +=  flatten(name, { "RootArray": object });
            } else if (objArrayItem === null) {
                arrayType += getTypes(arrayType, null);
            } else {
                arrayType += getTypes(arrayType, typeof objArrayItem);
            }
        });

        output += arrayType? `export type ${name}  = ${arrayType}; \n` : '';
        return output;
    }



    const getArrayType = (keyName, array) => {
        let arrayType = '';
        array.forEach(arrayItem => {
            // Child is Array
            if (Array.isArray(arrayItem)) {
                arrayType += getTypes(arrayType, getArrayType(keyName, arrayItem));
            }
            // Child is Json
            else if (isJSON(arrayItem)) {
                let objectFlattened = flatten(keyName, arrayItem);
                result = { ...result, ...objectFlattened };
                arrayType += getTypes(arrayType, toCamelCase(keyName));
            }
            // If it is null
            else if (arrayItem === null) {
                arrayType += getTypes(arrayType, null);
            }
            // Reset all type 
            else {
                arrayType += getTypes(arrayType, typeof arrayItem);
            }
        });
        return arrayType;
    }

    // Hydrate the object
    for (const key in object) {
        // Child is Array
        if (Array.isArray(object[key])) {
            let arrayType = `(${getArrayType(key, object[key])})[] | null`;
            result[name] = { ...result[name], [key]: arrayType };
        }
        // Child is Json
        else if (isJSON(object[key])) {
            let objectFlattened = {...flatten(key, object[key])};
            if (isNaN(key)){
                result[name] = { ...result[name], [key]: toCamelCase(key) };
            }
            if (!result[toCamelCase(key)]) {
                result = { ...result, ...objectFlattened };
            }
        }

        // If it is null
        else if (object[key] === null) {
            result[name] = { ...result[name], [key]: null };
        }
        // Reset all type 
        else {
            result[name] = { ...result[name], [key]: typeof object[key]} ;
        } 
    }
    return getInterfaces(name, result);
} 




const getInterfaces = (name , object)=> {
    let output = '';
    for (const key in object) {
        if (isNaN(key)) {
            let childObject = object[key];
            output += `export interface ${key} { \n`
    
            for (const childKey in childObject) {

                let optional = !childObject[childKey] || childObject[childKey].includes('null') ? '?': '';

                output += `  ${childKey + optional}: ${childObject[childKey]};\n`;
            }
            output += '}\n';
        }
    }

    return output
}





// Example

(function () {
    let object =
        `{
  "name": "Example JSON",
  "description": "Paste single object JSON the Types generator will auto-generate the interfaces for you",
  "acceptance": ["JSON", "Array"],
  "acceptedObjects": 1,
  "isDoubleQuotesSensitive": true,
  "validation": {
  	"quotes": true,
    "json": true,
    "array": true,
    "linters": true
  }
}`;
    EDITOR.getDoc().setValue(object)
})();
