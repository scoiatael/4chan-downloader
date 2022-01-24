class DownloadPageJob < ApplicationJob
  include ActiveJob::Status

  queue_as :default

  def perform(url, fname)
    do_download(url, **storage!(fname))
  end

  private

  def storage!(fname)
    dir = File.join(Parrhasius::DIR, fname)
    FileUtils.mkdir_p(dir)
    { path: dir, folder: Folder.create!(name: fname) }
  end

  def do_download(url, path:, folder:)
    pb = if Rails.env.development?
           ProgressBar
         else
           Parrhasius::ActiveJobPB.new(self)
         end
    images = Parrhasius::Download.new(Parrhasius::Download.for(url), path, pb).run(url)
    folder.images.create!(images.map { |image| Image.params_from_minimagick(image) })
    Parrhasius::Dedup.new(progress_bar: pb).run(folder.images)
    folder.images.reload
    Parrhasius::Minify.new(pb).run(folder.images).each do |img, dst|
      Thumbnail.create!(path: dst, image: img)
    end
  rescue StandardError
    folder.destroy if folder.images.empty?
    raise
  end
end
