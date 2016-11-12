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

class NpmPruneTask extends BaseTask {
	constructor( repository, options ) {
		super( repository, options );
	}

	process() {
		return this.getPackageJson()
			.bind( this )
			.then( this.getNpmPath )
			.then( this.prune )
			.catch( errors.PackageJsonNotFoundError, err => {
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

	prune( npmPath ) {
		const parameters = [ "prune", "--silent" ];

		log.notice( `Pruning node modules in '${this.repoPath}'` );
		cliLog( npmPath, [ "prune", "--silent" ], this.repoPath, log );

		return execa( npmPath, parameters, {
			cwd : this.repoPath
		} )
			.catch( error => {
				log.error( `Error while running 'npm prune' in '${this.repoPath}':` );
				log.error( error.stderr );
				log.warn( error );
				throw error;
			} );
	}
}

function taskFactory( repository, options ) {
	const task = new NpmPruneTask( repository, options );
	return task.process();
}

module.exports = taskFactory;