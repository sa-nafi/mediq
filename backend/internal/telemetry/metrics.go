package telemetry

import (
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
)

var (
	// HTTPRequestsTotal counts total HTTP requests handled by method, path, and status code.
	HTTPRequestsTotal = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Name: "http_requests_total",
			Help: "Total number of HTTP requests processed.",
		},
		[]string{"method", "path", "status"},
	)

	// HTTPRequestDuration tracks request latency in seconds.
	HTTPRequestDuration = promauto.NewHistogramVec(
		prometheus.HistogramOpts{
			Name:    "http_request_duration_seconds",
			Help:    "HTTP request latency distributions in seconds.",
			Buckets: []float64{0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0},
		},
		[]string{"method", "path", "status"},
	)

	// HTTPRequestsInFlight tracks the current number of requests actively executing.
	HTTPRequestsInFlight = promauto.NewGaugeVec(
		prometheus.GaugeOpts{
			Name: "http_requests_in_flight",
			Help: "Current number of in-flight HTTP requests.",
		},
		[]string{"method"},
	)
)

// dbPoolCollector implements prometheus.Collector to dynamically export pgxpool stats on scrape.
type dbPoolCollector struct {
	pool            *pgxpool.Pool
	acquiredDesc    *prometheus.Desc
	idleDesc        *prometheus.Desc
	totalDesc       *prometheus.Desc
	maxDesc         *prometheus.Desc
	emptyAcquireDesc *prometheus.Desc
}

// NewDBPoolCollector returns a prometheus.Collector that inspects a pgxpool.Pool.
func NewDBPoolCollector(pool *pgxpool.Pool) prometheus.Collector {
	return &dbPoolCollector{
		pool: pool,
		acquiredDesc: prometheus.NewDesc(
			"db_pool_conns_acquired",
			"Current number of acquired (in-use) database connections.",
			nil, nil,
		),
		idleDesc: prometheus.NewDesc(
			"db_pool_conns_idle",
			"Current number of idle database connections in the pool.",
			nil, nil,
		),
		totalDesc: prometheus.NewDesc(
			"db_pool_conns_total",
			"Total number of open database connections in the pool.",
			nil, nil,
		),
		maxDesc: prometheus.NewDesc(
			"db_pool_conns_max",
			"Configured maximum number of connections in the pool.",
			nil, nil,
		),
		emptyAcquireDesc: prometheus.NewDesc(
			"db_pool_empty_acquire_count_total",
			"Total number of connection acquires that had to wait for a connection.",
			nil, nil,
		),
	}
}

// Describe sends the super-set of all possible descriptors of metrics the Collector will collect.
func (c *dbPoolCollector) Describe(ch chan<- *prometheus.Desc) {
	ch <- c.acquiredDesc
	ch <- c.idleDesc
	ch <- c.totalDesc
	ch <- c.maxDesc
	ch <- c.emptyAcquireDesc
}

// Collect is called by the Prometheus registry when collecting metrics.
func (c *dbPoolCollector) Collect(ch chan<- prometheus.Metric) {
	stat := c.pool.Stat()

	ch <- prometheus.MustNewConstMetric(c.acquiredDesc, prometheus.GaugeValue, float64(stat.AcquiredConns()))
	ch <- prometheus.MustNewConstMetric(c.idleDesc, prometheus.GaugeValue, float64(stat.IdleConns()))
	ch <- prometheus.MustNewConstMetric(c.totalDesc, prometheus.GaugeValue, float64(stat.TotalConns()))
	ch <- prometheus.MustNewConstMetric(c.maxDesc, prometheus.GaugeValue, float64(stat.MaxConns()))
	ch <- prometheus.MustNewConstMetric(c.emptyAcquireDesc, prometheus.CounterValue, float64(stat.EmptyAcquireCount()))
}

// RegisterDBPoolMetrics registers the database pool stats collector with Prometheus.
func RegisterDBPoolMetrics(pool *pgxpool.Pool) {
	prometheus.MustRegister(NewDBPoolCollector(pool))
}
