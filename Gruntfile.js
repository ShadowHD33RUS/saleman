module.exports = function(grunt) {
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		concat: {
			options: {
				separator: ';'
			},
			app: {
				src: ['app/**/*.js', 'app/*.js', '!app/bootstrapper.js', '!app/config.js'],
				dest: 'temp/<%= pkg.name %>.js'
			},
			libs: {
				src: ['assets/js/aes.js', 'assets/js/angular.min.js', 'assets/js/*js', '!assets/js/jquery*'],
				dest: 'temp/<%= pkg.name %>-libs.js'
			},
			bootstrapper: {
				src: ['app/config.js', 'app/bootstrapper.js'],
				dest: 'temp/bootstrapper.js'
			}
		},
		uglify: {
			options: {
				banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
			},
			dist: {
				files: {
					'temp/<%= pkg.name %>.min.js': ['<%= concat.app.dest %>'],
					'temp/bootstrapper.min.js': ['<%= concat.bootstrapper.dest %>'],
					'temp/<%= pkg.name %>-libs.min.js': ['<%= concat.libs.dest %>']
				}
			}
		},
		copy: {
			main: {
				files: [
					{src: 'index.html', dest: 'build/index.html'},
					{src: 'recover.html', dest: 'build/recover.html'},
					{src: 'temp/bootstrapper.min.js', dest: 'build/app/bootstrapper.js'},
					{
						expand: true,
						src: [
							'temp/<%= pkg.name %>.min.js',
							'temp/<%= pkg.name %>-libs.min.js',
							'assets/js/jquery*',
							'assets/js/materialize*'
						],
						dest: 'build/assets/js',
						flatten: true,
						filter: 'isFile',
					},
					{
						expand: true,
						cwd: 'app/components',
						src: ['**/*.html'],
						filter: 'isFile',
						dest: 'build/app/components'
					},
					{expand: true, cwd: 'assets/css/', src: ['**'], filter: 'isFile', dest: 'build/assets/css'},
					{expand: true, cwd: 'assets/font/', src: ['**'], filter: 'isFile', dest: 'build/assets/font'},
					{expand: true, cwd: 'assets/img/', src: ['**'], filter: 'isFile', dest: 'build/assets/img'}
				]
			}
		},
		'sftp-deploy': {
			deploy: {
				auth: {
					host: '185.87.49.173',
					port: 2015,
					authKey: 'production'
				},
				src: 'build',
				dest: '/var/www/html',
				progress: true
			}
		}
	});
	
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-sftp-deploy');
	
	grunt.registerTask('compileApp', ['concat', 'uglify', 'copy']);
};