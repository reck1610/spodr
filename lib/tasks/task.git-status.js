"use strict";

const GitWrapper = require( "./../git/git" );
const BaseTask   = require( "./_task" );
const Promise    = require( "bluebird" );

const _      = require( "lodash" );
const errors = require( "../errors" );
const fs     = Promise.promisifyAll( require( "fs" ) );
const log    = require( "fm-log" ).module();
const path   = require( "path" );
const utils  = require( "./utils" );

class GitStatusTask {
	constructor( repository, options ) {
		this.repository = repository;
		this.options    = options;
	}

	process() {
		const git = new GitWrapper( this.repository.path );
		git.prefix( this.repository.name );

		return git.status()
			.then( status => {
				if( status.behind > 0 ) {
					log.notice( `'${repository.name}' is ${status.behind} behind` );
				}
			} );
	}
}

function taskFactory( repository, options ) {
	const task = new GitStatusTask( repository, options );
	return task.process();
}

module.exports = taskFactory;

