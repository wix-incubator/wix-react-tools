
export function hello(name:string){
    return "Hello "+name;
}

export function helloObj(name:string, greet:(a:string)=>string){
    return {name, greet:greet(name)};
}
