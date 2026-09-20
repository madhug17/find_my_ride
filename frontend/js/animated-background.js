/**
 * AnimatedBackground — Vanilla JS implementation inspired by Motion Primitives.
 * Creates an animated background pill that floats and springs between tab items on hover and click.
 */
class AnimatedBackground {
    constructor(container, options = {}) {
        if (typeof container === 'string') {
            this.container = document.querySelector(container);
        } else {
            this.container = container;
        }

        if (!this.container) return;

        this.options = {
            defaultValue: options.defaultValue || null,
            className: options.className || 'animated-bg-pill',
            enableHover: options.enableHover !== undefined ? options.enableHover : true,
            transition: options.transition || {
                duration: 0.3,
                bounce: 0.2
            },
            onValueChange: options.onValueChange || null,
            ...options
        };

        this.activeId = this.options.defaultValue;
        this.hoveredId = null;
        this.pill = null;
        this.items = [];

        this.init();
    }

    init() {
        // Collect children with data-id attribute
        this.items = Array.from(this.container.querySelectorAll('[data-id]'));
        if (this.items.length === 0) return;

        // Ensure container is relatively positioned
        const computedStyle = window.getComputedStyle(this.container);
        if (computedStyle.position === 'static') {
            this.container.style.position = 'relative';
        }

        // Create or locate pill element
        this.pill = this.container.querySelector('.animated-bg-pill');
        if (!this.pill) {
            this.pill = document.createElement('div');
            this.pill.className = this.options.className;
            this.container.insertBefore(this.pill, this.container.firstChild);
        }

        // Default pill styles
        this.pill.style.position = 'absolute';
        this.pill.style.pointerEvents = 'none';
        this.pill.style.top = '0';
        this.pill.style.left = '0';
        this.pill.style.opacity = '0';

        // Set up transition curve with spring bounce feel
        // Spring duration ~0.3s with slight overshoot
        const dur = this.options.transition.duration || 0.3;
        const springCurve = 'cubic-bezier(0.25, 1.25, 0.5, 1)';
        this.pill.style.transition = `transform ${dur}s ${springCurve}, width ${dur}s ${springCurve}, height ${dur}s ${springCurve}, opacity 0.2s ease`;

        this.bindEvents();

        // Initial positioning for default value
        requestAnimationFrame(() => {
            if (this.activeId) {
                this.setActive(this.activeId, false);
            }
        });
    }

    bindEvents() {
        this.items.forEach(item => {
            const id = item.getAttribute('data-id');

            // Hover interactions
            if (this.options.enableHover) {
                item.addEventListener('mouseenter', () => {
                    this.hoveredId = id;
                    this.moveTo(item);
                });
            }

            // Click interaction
            item.addEventListener('click', (e) => {
                this.setActive(id, true);
                if (typeof this.options.onValueChange === 'function') {
                    this.options.onValueChange(id, item, e);
                }
            });
        });

        // Mouse leave container -> return to active item
        if (this.options.enableHover) {
            this.container.addEventListener('mouseleave', () => {
                this.hoveredId = null;
                const activeItem = this.getItemById(this.activeId);
                if (activeItem) {
                    this.moveTo(activeItem);
                } else {
                    this.hidePill();
                }
            });
        }

        // Recalculate on window resize
        window.addEventListener('resize', () => {
            const target = this.getItemById(this.hoveredId || this.activeId);
            if (target) {
                // Temporarily disable transition during resize for crisp layout update
                const origTransition = this.pill.style.transition;
                this.pill.style.transition = 'none';
                this.moveTo(target);
                requestAnimationFrame(() => {
                    this.pill.style.transition = origTransition;
                });
            }
        });
    }

    getItemById(id) {
        if (!id) return null;
        return this.items.find(item => item.getAttribute('data-id') === id) || null;
    }

    moveTo(targetElement) {
        if (!targetElement || !this.pill) return;

        const containerRect = this.container.getBoundingClientRect();
        const targetRect = targetElement.getBoundingClientRect();

        const x = targetRect.left - containerRect.left;
        const y = targetRect.top - containerRect.top;
        const width = targetRect.width;
        const height = targetRect.height;

        this.pill.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        this.pill.style.width = `${width}px`;
        this.pill.style.height = `${height}px`;
        this.pill.style.opacity = '1';
    }

    hidePill() {
        if (this.pill) {
            this.pill.style.opacity = '0';
        }
    }

    setActive(id, triggerUpdate = true) {
        this.activeId = id;
        this.items.forEach(item => {
            if (item.getAttribute('data-id') === id) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

        const target = this.getItemById(id);
        if (target) {
            this.moveTo(target);
        }
    }
}

// Global exposure
window.AnimatedBackground = AnimatedBackground;
