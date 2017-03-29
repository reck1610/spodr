"use strict";

const GitWrapper = require( "./../git/git" );
const BaseTask   = require( "./_task" );
const Promise    = require( "bluebird" );
const Table      = require( "cli-table" );

const _      = require( "lodash" );
const chalk  = require( "chalk" );
const errors = require( "../errors" );
const fs     = Promise.promisifyAll( require( "fs" ) );
const log    = require( "fm-log" ).module();
const path   = require( "path" );
const utils  = require( "./utils" );

class GitStatusTask {
	constructor( repositories, options ) {
		const self = this;

		self.repositories = repositories;
		self.options = options;

		const tableOpts = {
      		head: [
        		chalk.cyan( "Directory" ),
        		chalk.cyan( "Branch" ),
        		chalk.cyan( "Ahead" ),
        		chalk.cyan( "Behind" ),
        		chalk.cyan( "Untracked" )
      		]
		};	

		self.table = new Table( tableOpts );
	}

	process() {
		const self = this;

		return Promise.map( self.repositories, self.getStatus.bind( self ), {
				concurrency : self.options.parallelExecutions
			} )
			.then( () => {
				console.log( self.table.toString() );
			});
	}

	getStatus( repository ){
		const self = this;

		const git = new GitWrapper( repository.path );
		git.prefix( repository.name );

		return git.status()
			.then( status => {
				const colorize = status.ahead || status.behind ? chalk.red : chalk.green;

				self.table.push([
					colorize( repository.path ),
					colorize( status.current ),
					colorize( status.ahead ),
					colorize( status.behind ),
					colorize( status.notAdded.length )
				]);
			} );
	}
}

function taskFactory( repositories, options ) {
	const task = new GitStatusTask( repositories, options );
	return task.process();
}

module.exports = taskFactory;

