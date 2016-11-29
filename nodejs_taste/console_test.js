console.time('small loop');
for (var i = 0; i < 100000; i++) {
    ;
}
console.timeEnd('small loop');
//console.log(global);
console.log(__filename);
console.log(__dirname);