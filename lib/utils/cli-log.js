"use strict";

/**
 * Logs a CLI call.
 * @param {String} executable The binary that is invoked on the CLI.
 * @param {Array<String>} parameters The parameters that are passed to the binary.
 * @param {String} cwd The working directory the command is executed in.
 * @param {Logger} logger fm-log logger
 */
function log( executable, parameters, cwd, logger ) {
	parameters = parameters || [];
	logger     = logger || require( "fm-log" ).module( "cli" );
	cwd        = cwd || process.cwd();

	logger.debug( `Executing: ${executable} ${parameters.join( " " )}` );
	logger.debug( `In       : ${cwd}` );
}

module.exports = log;
