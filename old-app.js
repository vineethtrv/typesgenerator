const RESULT_EL = document.getElementById('type-result');
const INPUT_EL = document.getElementById('type-input');
const NAME_EL = document.getElementById('root-name');
const BTN_COPY = document.getElementById('btn-copy');

let output;
let name = 'Root'

const toCamelCase =  (str) =>{
    str = str.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (m, chr) => chr.toUpperCase());
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

const isJSON = (item) => {
    return typeof item === 'object' && !Array.isArray(item) && item;
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
        RESULT.getDoc().setValue(getInterfaces(name, object));
    }
}



const getInterfaces = (name , object)=> {
    let output = `export interface ${toCamelCase(name)} { \n`;
    let collection = {};

    // object is array
    if (Array.isArray(object)){
        output = '';
        let arrayType = toCamelCase(name);

        object.forEach(objArrayItem => {
            if (typeof objArrayItem === 'object' &&  objArrayItem !== null){
                collection = {...collection, ...objArrayItem};
                
            } else if (objArrayItem !== null){
                console.log('collection')
            } else {
                arrayType += arrayType.includes(typeof objArrayItem) ? '' : ' | ' + typeof objArrayItem;
            }
        });
        
        output += getInterfaces(name, collection)
        output += arrayType.includes("|")? `export type ${toCamelCase(name)}  = ${arrayType}; \n`: '';
        return output;
    }


    for (const key in object) {


        // Children is array type
        if (Array.isArray(object[key])){

            let arrayType = '';
            
            object[key].forEach( item  => {
                if (typeof item === 'object'){
                    
                    if (Array.isArray(item)) {
                        arrayType += getTypes(arrayType, "[]");
                    } 
                    else if (isJSON(item)){
                        arrayType += getTypes(arrayType, "any");
                    }
                    else if (item === null){
                        arrayType += getTypes(arrayType, null);
                    }
                    else {
                        collection[`${key}`] = item;
                        arrayType += getTypes(arrayType, toCamelCase(key));
                    }
                    
                } else{
                    arrayType += getTypes(arrayType, typeof item);
                }
            });

            arrayType = arrayType.length ? `(${arrayType})`: '';

            output += `  ${key}?: ${arrayType}[] | null;\n`;
        } 
        // Children is Json object
        else if (isJSON(object[key])){
            output += `  ${key}: ${toCamelCase(key)};\n`;
            collection[`${key}`] = object[key];
        }
        // Children is Null
        else if (object[key] === null) {
            output += `  ${key}: null;\n`;
            collection[`${key}`] = object[key];
        }
        else{
            output += `  ${key}: ${typeof object[key]};\n`;
        }
    }
    output += '}\n';



    for (const key in collection) {
        output += getInterfaces(key, collection[key]);
    }


    return output
}




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
    "case": false,
    "linters": true
  }
}`;
    EDITOR.getDoc().setValue(object)
})();

