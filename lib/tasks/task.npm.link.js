"use strict";

const BaseTask = require( "./_task" );
const Promise  = require( "bluebird" );

const _          = require( "lodash" );
const cliLog     = require( "../utils/cli-log" );
const errors     = require( "../errors" );
const execa      = require( "execa" );
const fs         = Promise.promisifyAll( require( "fs" ) );
const log        = require( "fm-log" ).module();
const path       = require( "path" );
const whichAsync = Promise.promisify( require( "which" ) );

class NpmLinkTask extends BaseTask {
	constructor( repository, options ) {
		super( repository, options );
	}

	process() {
		return this.getPackageJson()
			.bind( this )
			.then( this.getNpmPath )
			.then( this.link )
			.catch( errors.PackageJsonNotFoundError, () => {
				log.info( `'${this.repository.name}' is not a NodeJS project. Skipping.` );
			} );
	}

	getNpmPath() {
		return whichAsync( "npm" )
			.catch( err => {
				throw new errors.NpmNotFoundError();
			} );
	}

	getPackageJson() {
		return fs.statAsync( path.join( this.repoPath, "package.json" ) )
			.then( stats => {
				if( !stats.isFile() ) {
					throw new errors.PackageJsonNotFoundError( `No package.json present '${this.repoPath}'` );
				}
			} )
			.catch( {
				code : "ENOENT"
			}, err => {
				throw new errors.PackageJsonNotFoundError( `No package.json present '${this.repoPath}'` );
			} );
	}

	link( npmPath ) {
		log.notice( `Globally linking module '${this.repository.name}'` );
		cliLog( npmPath, [ "link" ], this.repoPath, log );
		return execa( npmPath, [ "link" ], {
			cwd : this.repoPath
		} )
			.catch( error => {
				log.error( error.stderr );
				throw error;
			} );
	}
}

function taskFactory( repository, options ) {
	const task = new NpmLinkTask( repository, options );
	return task.process();
}

module.exports = taskFactory;
