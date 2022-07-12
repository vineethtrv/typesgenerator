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
        let object = JSON.parse(EDITOR.doc.getValue())
        let name = NAME_EL.value.trim() ? NAME_EL.value : 'Root Object'
        RESULT.getDoc().setValue(getInterfaces(name, object))
    }
}



const getInterfaces = (name , object)=> {
    let output = `export interface ${toCamelCase(name)} { \n`;
    let collection = {};


    if (Array.isArray(object)){
        output = '';
        let arrayType = toCamelCase(name);

        object.forEach(objArrayItem => {
            if (typeof objArrayItem === 'object'){
                collection = {...collection, ...objArrayItem};
            } else {
                arrayType += arrayType.includes(typeof objArrayItem) ? '' : ' | ' + typeof objArrayItem;
            }
        });
        
        output += getInterfaces(name, collection)
        output += arrayType.includes("|")? `export type ${toCamelCase(name)}  = ${arrayType}; \n`: '';
        return output;
    }


    for (const key in object) {
        if (Array.isArray(object[key])){

            let arrayType = '';
            
            object[key].forEach( item  => {
                if (typeof item === 'object'){
                    
                    if (Array.isArray(item)) {
                        return
                    } else {
                        collection[`${key}`] = item;
                    }
                    
                    arrayType += getTypes(arrayType, toCamelCase(key));
                } else{
                    arrayType += getTypes(arrayType, typeof item);
                }
            });

            arrayType = arrayType.length ? `(${arrayType})`: '';

            output += `  ${key}?: ${arrayType}[] | null;\n`;
        } 
        else if (typeof object[key] === 'object' && !Array.isArray(object[key])){
            output += `  ${key}: ${toCamelCase(key)};\n`;
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



