
IMAGE=cronicle

run: build
	docker run --rm -it \
		-p 3012:3012 \
		$(IMAGE)

build:
	docker build -t $(IMAGE) .