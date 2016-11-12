"use strict";

const Promise = require( "bluebird" );

const _                    = require( "lodash" );
const argv                 = require( "minimist" )( process.argv.slice( 2 ) );
const attemptRequire       = require( "attempt-require" );
const ConfigurationBuilder = require( "./config/builder" );
const errors               = require( "./errors" );
const log                  = require( "fm-log" ).module();
const path                 = require( "path" );
const sshAgent             = require( "./ssh-agent" );
const tasks                = require( "./tasks" );

class Application {
	boot() {
		return Promise.resolve( Application.determineTask() )
			.then( task => {
				this.task = task;

				return new ConfigurationBuilder().cli()
					.then( configuration => {
						this.config = configuration;

						if( !configuration.verbose ) {
							require( "fm-log" ).logFactory.require( require( "fm-log" ).LogLevels.INFO );
						}

						// Tasks that require no configuration cause instantly bail out.
						if( task === "showHelp" || task === "init" ) {
							return;
						}

						// Build configuration for current location.
						return new ConfigurationBuilder().build()
							.bind( this )
							.then( configuration => {
								this.config = configuration;
							} )
							.then( () => sshAgent.getEnvironment() )
							.then( () => this.prepareRepositories() )
							.then( repositories => {
								this.repositories = repositories;
							} );
					} );
			} );
	}

	static determineTask() {
		if( process.argv[ 2 ] === "help" ) {
			return "showHelp";

		} else if( process.argv[ 2 ] === "init" ) {
			return "init";

		} else if( process.argv[ 2 ] === "create" ) {
			return "create";

		} else if( process.argv[ 2 ] === "update" ) {
			return "update";
		}
	}

	start() {
		switch( this.task ) {
			case "showHelp":
				// TODO: Display help message with allowed options
				console.log( "Help!" );
				break;

			case "init":
				this.init();
				break;

			case "create":
				this.create();
				break;

			case "update":
				this.update();
				break;

			default:
				log.notice( "No valid options provided. Try 'spodr help' to get a list of possible options." );
		}
	}

	init() {
		if( !argv.github && !argv.gitlab ) {
			throw new errors.MissingArgumentError( "Missing importer. Specify either --github or --gitlab" );
		}

		// Construct importer.
		const Importer = require( "./importer" );
		let importer;

		if( argv.github ) {
			importer = new Importer.GitHub( argv.github, argv );
		} else if( argv.gitlab ) {
			importer = new Importer.GitLab( argv.gitlab, argv );
		}

		return importer.check()
			.catch( errors.MissingArgumentError, error => {
				log.error( error.message );
				process.exit( 1 );
			} )
			.then( () => {
				return importer.process();
			} )
			.then( configuration => {
				this.repositories = configuration.repositories;
			} )
			.then( () => this.create() );
	}

	create() {
		if( !this.repositories || !this.repositories.length ) {
			log.notice( "No repositories found. Nothing to do." );
			return Promise.resolve( this.repositories );
		}

		return Promise.map( this.repositories, _.partial( tasks.create, _, this.config ), {
				concurrency : this.config.parallelExecutions
			} )
			.bind( this )
			.filter( Boolean )
			.then( result => {
				log.notice( `${result.length} repositories created.` );
				return result;
			} )
			.then( () => this.finish() )
			.catch( err => {
				log.error( err );
			} );
	}

	update() {
		let updatePromise;

		// By default, we git pull all relevant branches, unless invoked with --skip-git.
		if( !argv[ "skip-git" ] ) {
			updatePromise = tasks.update( this.config );
		} else {
			updatePromise = Promise.resolve( this.repositories );
		}

		// The git update task will return an update repository configuration list.
		// This list has the global configuration merged with .syncrc files from the repositories themselves.

		if( argv.prune ) {
			updatePromise = updatePromise
				.then( repositories => {
					return this.npmPrune( repositories )
						.return( repositories );
				} );
		}

		if( argv.link ) {
			updatePromise = updatePromise
				.then( repositories => {
					return this.npmLink( repositories )
						.return( repositories );
				} );
		}

		if( argv.linkdep ) {
			updatePromise = updatePromise
				.then( repositories => {
					return this.linkdep( repositories )
						.return( repositories );
				} );
		}

		if( argv.npm ) {
			updatePromise = updatePromise
				.then( repositories => {
					return this.npmInstall( repositories )
						.return( repositories );
				} );
		}

		return updatePromise
			.then( this.finish.bind( this ) )
			.catch( errors.WorkingDirectoryNotCleanError, error => {
				log.error( "Dirty working directories detected. Aborting." );
				process.exit( 1 );
			} );
	}

	/**
	 * Run "npm install" in a set of repositories.
	 * @param {Array} [repositories] The repositories to run "npm install" in. By default, all project directories are used.
	 * @returns {Promise.<TResult>}
	 */
	npmInstall( repositories ) {
		if( !repositories || !repositories.length ) {
			log.notice( "No repositories found. Nothing to do." );
			return Promise.resolve( repositories );
		}

		return Promise.map( repositories, _.partial( tasks.npmInstall, _, this.config ), {
				concurrency : this.config.parallelExecutions
			} )
			.then( () => log.notice( `NPM modules updated.` ) )
			.catch( err => {
				log.error( err.message );
				log.debug( err );
			} )
			.return( repositories );
	}

	/**
	 * Run "npmInstall link" in a set of repositories.
	 * @param {Array} [repositories] The repositories to run "npmInstall link" in. By default, all project directories are used.
	 * @returns {Promise.<TResult>}
	 */
	npmLink( repositories ) {
		if( !repositories || !repositories.length ) {
			log.notice( "No repositories found. Nothing to do." );
			return Promise.resolve( repositories );
		}

		return Promise.map( repositories, _.partial( tasks.npmLink, _, this.config ), {
				concurrency : this.config.parallelExecutions
			} )
			.then( () => log.notice( `NPM modules globally linked.` ) )
			.catch( err => {
				log.error( err.message );
				log.debug( err );
			} )
			.return( repositories );
	}

	linkdep( repositories ) {
		if( !repositories || !repositories.length ) {
			log.notice( "No repositories found. Nothing to do." );
			return Promise.resolve( repositories );
		}

		return Promise.map( repositories, _.partial( tasks.linkdep, _, this.config, this.repositories ), {
				concurrency : this.config.parallelExecutions
			} )
			.then( () => log.notice( `NPM dependencies linked.` ) )
			.catch( err => {
				log.error( err.message );
				log.debug( err );
			} )
			.return( repositories );
	}

	npmPrune( repositories ) {
		if( !repositories || !repositories.length ) {
			log.notice( "No repositories found. Nothing to do." );
			return Promise.resolve( repositories );
		}

		return Promise.map( repositories, _.partial( tasks.npmPrune, _, this.config ), {
				concurrency : this.config.parallelExecutions
			} )
			.then( () => log.notice( `NPM modules pruned.` ) )
			.catch( err => {
				log.error( err.message );
				log.debug( err );
			} )
			.return( repositories );
	}

	prepareRepositories() {
		const repositories = _.clone( this.config.repositories );
		if( !repositories ) {
			return Promise.resolve( repositories );
		}

		return Promise.map( repositories, repository => {
			repository.path = path.join( repository.target || process.cwd(), repository.name );

			const packageJson = attemptRequire( path.join( repository.path, "package.json" ) );

			if( packageJson ) {
				repository.packageName = packageJson.name;
			}

			return repository;
		} );
	}

	finish() {
		log.notice( `Operation finished` );
		process.exit();
	}
}

module.exports = new Application();