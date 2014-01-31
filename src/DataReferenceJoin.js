//------------------------------------------------------------------------------
// A Jane Data Reference (JDR) Join is a deep copy of two other JDRs using 
// typical JOIN database concepts on a single field with matching criteria.
//
// - Inner Join delivers all records that match the field criteria for both
//   source JDRs, i.e. the intersection of the two JDRs.
// - Left Outer Join delivers all the records in the left JDR, merged with 
//   records from the right JDR that match the field criteria.
// - Right Outer Join delivers all the records in the right JDR, merged with
//   records from the left JDR that match the field criteria.
// - Full Outer Join delivers all records from both the left and the right JDR,
//   with records that match the field criteria merged.
//
// object interface
//  - property: match - the name of the field to match when merging, we assume
//                      equality is the matching criteria
//  
//------------------------------------------------------------------------------

Jane.DataObjectJoin = function (base) {
    var DataObjectJoin = Object.create(base);

    return DataObjectJoin;
}(Jane.DataObject);
