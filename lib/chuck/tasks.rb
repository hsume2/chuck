namespace :assets do
  namespace :chuck do

    source      = File.expand_path '../../chuck.js', File.dirname(__FILE__)
    destination = 'public/javascripts/vendor/chuck.js'

    directory destination

    task :rails_2_only do
      unless defined?(Rails) && Rails::VERSION::MAJOR == 2
        fail "This task is only available for Rails 2"
      end
    end

    desc "Sync chuck.js to #{destination}. Rails 2 only"
    task :sync => [:rails_2_only, destination] do
      puts "Copying #{source} to #{destination}"
      system "cp -v #{source} #{destination}"
      puts "Finished copying. Thanks for being DRY :)"
    end

  end
end
