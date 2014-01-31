//------------------------------------------------------------------------------
// filter and transform plugins are javascript objects with a defined interface:
//  - property: name
//  - function: handleRecord (record, readOnly)
//  
//------------------------------------------------------------------------------
Jane.Transform = function (base) {
    var Transform = Object.create(base);
    return Transform;
}(null);
