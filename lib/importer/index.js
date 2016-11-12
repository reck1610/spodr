"use strict";

const _ = require( "lodash" );

module.exports = {
	GitLab : require( "./gitlab" ),
	GitHub : require( "./github" )
};

// Export all symbols in lower case as well, to make it easier to look them up from CLI arguments.
_.forEach( module.exports, ( value, key ) => module.exports[ key.toLowerCase() ] = value );
