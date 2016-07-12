esOverview.service( 
  'EsManager',
  ['$rootScope', '$location', '$http', '$timeout', 'EsClient', 'esIndex', 'esType', 'esSize', 'esDefaultSort', 'esApplyQuery', 'defaultLayout', 'debug',
  function ($rootScope, $location, $http, $timeout, EsClient, esIndex, esType, esSize, esDefaultSort, esApplyQuery, defaultLayout, debug)
  {
    /** <redacted> */

    /**
     *  Send Elasticsearch request
     *  Retrieve results through the getResults() method
     */
    this.search = function () {
        // Set supported query operators
        var Operators = { EQ: '=', NEQ: '!=', GT: '>', LT: '<', GTE: '>=', LTE: '<=' };

        /** <redacted> */

        // Apply global non-fuzzy query parameters
        if (esApplyQuery !== undefined) {
            esApplyQuery.forEach(function (applyQuery) {
                var splitted = applyQuery.split(':'),
                    field = splitted.shift(),
                    term = splitted.pop(),
                    operator = splitted.shift() || Operators.EQ;

                // Map operator to our defined Operators
                switch (operator) {
                    case Operators.GT:
                        query.must(ejs.RangeQuery(field).gt(term));
                        break;
                    case Operators.LT:
                        query.must(ejs.RangeQuery(field).lt(term));
                        break;
                    case Operators.GTE:
                        query.must(ejs.RangeQuery(field).gte(term));
                        break;
                    case Operators.LTE:
                        query.must(ejs.RangeQuery(field).lte(term));
                        break;
                    case Operators.NEQ:
                        query.mustNot(ejs.MultiMatchQuery(field, term));
                        break;
                    case Operators.EQ:
                    default:
                        query.must(ejs.MultiMatchQuery(field, term));
                }
            });
        }

        // Set a fallback matchall query if query has not been initialized
        if (query === false) {
            // Reset query (match all)
            query = ejs.MatchAllQuery();
        }

        // Set query in request object
        searchRequest.query(query);

        /** <redacted> */
    };

    /** <redacted> */

}]);
