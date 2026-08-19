import webforge
site = webforge.crawl("https://tomtran-portfolio.vercel.app/", max_pages=10)
site.to_zip("portfolio.zip")